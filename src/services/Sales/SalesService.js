import { salesRepository } from '../../data/repositories/SalesRepository'
import { contractRepository } from '../../data/repositories/ContractRepository'
import { normalizeDate, isSameDay } from '../../utils/date'
import { SalesAuditLogger } from './audit/SalesAuditLogger'
import { LedgerService, STANDARD_ACCOUNTS, safeLedgerCall } from '../Ledger/LedgerService'
import { SalesPaymentProcessor } from './SalesPaymentProcessor'
import { SaleSchema } from '../../data/schemas/Financial/SaleSchema'
import { generateSaleId } from '../../utils/sequence'
import { FinancialCalculator } from '../Financial/Core/FinancialCalculator'
import { SalesRules } from './domain/SalesRules'


/**
 * Serviço de Vendas - Decoupled & Organized
 */
export const SalesService = {

    /**
     * Determina a data de vencimento do saldo remanescente de uma venda.
     * Regra de Negócio: Se não houver data explícita, vence em 30 dias.
     */
    calculateBalanceDueDate: (saleData) => {
        if (saleData.dueDateBalance) return normalizeDate(saleData.dueDateBalance);
        if (saleData.firstPaymentDate) return normalizeDate(saleData.firstPaymentDate);

        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
    },

    /**
     * Processa uma venda completa seguindo os princípios de Imutabilidade e Partidas Dobradas.
     */
    processSale: async (idTenant, idBranch, userId, rawSaleData) => {
        // 1. Validar Schema da Venda (Rigorous Validation)
        await SaleSchema.validate(rawSaleData, { abortEarly: false })

        // 1.5. Verificar Caixa (Prevenir vendas órfãs se o caixa estiver fechado)
        // Se houver pagamentos imediatos (Dinheiro, PIX, Cartão), o caixa DEVE estar aberto.
        const hasImmediatePayment = rawSaleData.payments?.some(p =>
            ['money', 'pix', 'credit_card', 'debit_card'].includes(p.methodId)
        );

        if (hasImmediatePayment) {
            const isToday = isSameDay(normalizeDate(rawSaleData.saleDate), new Date());
            if (isToday) {
                const { CashierService } = await import('../Financial/CashierService');
                await CashierService.ensureOpenSession(idTenant, idBranch, userId);
            }
        }

        // 2. Garantir tipagem segura para cálculos financeiros (Anti-NaN)
        const saleData = {
            ...rawSaleData,
            saleDate: normalizeDate(rawSaleData.saleDate) || normalizeDate(new Date()),
            startDate: normalizeDate(rawSaleData.startDate) || normalizeDate(new Date()),
            subtotal: parseFloat(rawSaleData.subtotal) || 0,
            total: parseFloat(rawSaleData.total) || 0,
            totalPaid: parseFloat(rawSaleData.totalPaid) || 0,
            balance: parseFloat(rawSaleData.balance) || 0
        };

        // 2.5. VALIDAÇÃO CRÍTICA (Delegada para FinancialCalculator)
        if (saleData.items && saleData.items.length > 0) {
            const validation = FinancialCalculator.validateSaleIntegrity(saleData);

            if (!validation.isValid) {
                throw new Error(validation.errors.join(' | ')); // Unifica erros se houver múltiplos
            }
        }

        // 2.6 Calcular isRenewal automaticamente (Renovação se gap <= 45 dias)
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository');
        const { ClientContractSalesClassificationRules } = await import('../Clients/ClientContract/domain/ClientContractSalesClassificationRules');

        const existingContracts = await clientContractRepository.findByClient(idTenant, idBranch, saleData.idClient);

        // Encontrar o último contrato para classificar
        const sorted = [...existingContracts].sort((a, b) => {
            const dateA = normalizeDate(a.endDate);
            const dateB = normalizeDate(b.endDate);
            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        });
        const lastContract = sorted[0];

        saleData.isRenewal = ClientContractSalesClassificationRules.classify(
            lastContract?.endDate,
            saleData.startDate
        ) === 'renewal';

        // 3. Gerar número de venda amigável sequencial (ex: V00001, V00002)
        const saleNumber = await generateSaleId(idTenant, idBranch);

        // 4. Salvar o documento principal da Venda
        const newSale = await salesRepository.create(idTenant, idBranch, {
            ...saleData,
            saleNumber: saleNumber,
            friendlyId: saleNumber,
            status: saleData.balance > 0.01 ? 'partial' : 'paid',
            createdBy: userId, // ✅ Fundamental para o Dashboard Operacional
            createdAt: normalizeDate(new Date()),
            deletedAt: null
        })



        // 5. Processar cada pagamento recebido (Delegado para SalesPaymentProcessor)
        if (saleData.payments && saleData.payments.length > 0) {
            // Import dinâmico ou estático - assumindo estático
            for (const payment of saleData.payments) {
                if (payment.methodId === 'money') {
                    await SalesPaymentProcessor.processCashPayment(idTenant, idBranch, userId, newSale, payment);
                } else if (payment.methodId === 'pix') {
                    await SalesPaymentProcessor.processPixPayment(idTenant, idBranch, userId, newSale, payment);
                } else if (['debit_card', 'credit_card'].includes(payment.methodId)) {
                    await SalesPaymentProcessor.processCardPayment(idTenant, idBranch, userId, newSale, payment, {
                        idClient: saleData.idClient,
                        clientName: saleData.clientName,
                        friendlyId: saleData.friendlyId
                    });
                } else {
                    // STRICT MODE: Não aceitar métodos desconhecidos silenciosamente.
                    // Para robustez, se o método não tem processador específico, deve ser tratado ou rejeitado.
                    // Vamos assumir que outros métodos (ex: boleto, transferencia) seguem o fluxo de 'outros' ou lançar erro.
                    // Se quisermos aceitar genéricos, usamos um processador genérico. Se quisermos rigor, erro.
                    // Dado o pedido do usuário ("sem fallbacks", "robusto"), erro é melhor se não implementado.
                    // 'pix' and 'money' are covered. If 'bank_slip' comes, it's ignored today.
                    // Vamos implementar um GenericPayment ou lançar erro.
                    throw new Error(`Método de pagamento não suportado ou não implementado: ${payment.methodId}`);
                }
            }
        }

        // 6. Saldo Remanescente (Contas a Receber direto do cliente)
        if (saleData.balance > 0) {
            const balanceDate = SalesService.calculateBalanceDueDate(saleData);

            await SalesPaymentProcessor.processRemainingBalance(
                idTenant,
                idBranch,
                newSale,
                saleData.balance,
                {
                    idClient: saleData.idClient,
                    clientName: saleData.clientName,
                    friendlyId: saleData.friendlyId
                },
                balanceDate
            );
        }


        // 7. Gerar Contratos do Cliente e Atualizar Status (Nova Arquitetura)
        if (saleData.items && saleData.items.length > 0) {
            // Importa o serviço uma única vez
            const { ClientContractService } = await import('../Clients/ClientContract/ClientContractService')

            for (const item of saleData.items) {
                const itemType = String(item.type || '').toLowerCase();

                if (itemType === 'contract' || itemType === 'contrato') {
                    try {
                        // Buscar detalhes do template do contrato
                        const contractTemplate = await contractRepository.findById(idTenant, idBranch, String(item.idItem))

                        if (contractTemplate) {
                            // Calcular datas com base no template (Delegado para VigencyRules)
                            const { ClientContractVigencyRules } = await import('../Clients/ClientContract/domain/ClientContractVigencyRules');

                            const { endDate, planType } = ClientContractVigencyRules.calculatePeriod(
                                item.startDate,
                                contractTemplate.duration,
                                contractTemplate.durationType
                            );

                            // Cálculo de valor com desconto proporcional (se houver desconto na venda)
                            const { netPrice: netUnitPrice, discountValue: itemDiscount } =
                                FinancialCalculator.calculateProportionalDiscount(item.unitPrice, saleData.subtotal, saleData.total);

                            // Usa o novo ClientContractService (com transações)
                            await ClientContractService.create(idTenant, idBranch, userId, {
                                idClient: saleData.idClient,
                                clientName: saleData.clientName,
                                idSale: newSale.id,
                                idContract: item.idItem, // ID Unificado
                                planName: item.name || contractTemplate.title,
                                planType,
                                startDate: normalizeDate(item.startDate) || new Date(),
                                endDate,
                                originalValue: parseFloat(item.unitPrice) || 0,
                                discount: itemDiscount,
                                value: netUnitPrice,
                                totalValue: netUnitPrice * (parseInt(item.quantity) || 1),
                                installments: 1,
                                userName: saleData.sellerName || saleData.userName,
                                // Snapshot de Regras
                                rules: {
                                    allowFreeze: contractTemplate.allowFreeze ?? true,
                                    maxFreezeDays: contractTemplate.maxFreezeDays ?? 30,
                                    minPermanence: contractTemplate.minPermanence ?? 0,
                                    // Regras de Acesso (Controle de Frequência)
                                    accessLimitType: contractTemplate.accessLimitType || 'unlimited',
                                    accessLimitQuantity: contractTemplate.accessLimitQuantity || null,
                                    allowedWeekDays: contractTemplate.allowedWeekDays || [],
                                    unlimitedInOrigin: contractTemplate.unlimitedInOrigin ?? true,
                                    allowedBranches: contractTemplate.allowedBranches || []
                                }
                            })

                        } else {
                            console.warn(`⚠️ [DEBUG] Template de contrato não encontrado para idItem: ${item.idItem}`)
                        }
                    } catch (err) {
                        console.error(`❌ Erro ao criar contrato para ${item.name}:`, err)
                        // Não aborta a venda, mas registra o erro
                    }
                }
            }
        }

        // 8. ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        const revenueInfo = SalesRules.classifyRevenue(saleData.items);
        const revenueId = STANDARD_ACCOUNTS[revenueInfo.id];
        const revenueName = revenueInfo.name;

        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.createSaleEntry(idTenant, idBranch, {
                ...newSale,
                total: saleData.total,
                revenueAccountId: revenueId,
                revenueAccountName: revenueName
            }),
            { sourceType: 'sale', sourceId: newSale.id, operation: 'createSaleEntry' }
        );

        // 6. Auditoria (Rastreabilidade total)
        await SalesAuditLogger.logSaleProcessed({
            idTenant, idBranch, userId,
            userName: saleData.sellerName,
            sale: newSale,
            clientName: saleData.clientName
        })

        return newSale
    },

    /**
     * Busca uma venda pelo ID.
     */
    getById: async (idTenant, idBranch, idSale) => {
        return await salesRepository.findById(idTenant, idBranch, idSale);
    },

    /**
     * Lista o histórico de vendas de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        const data = await salesRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient]],
            { field: 'saleDate', direction: 'desc' }
        );
        return data.filter(s => !s.deletedAt);
    },

    /**
     * Lista todas as vendas (com suporte a filtros básicos)
     */
    listAll: async (idTenant, idBranch, limit = 50) => {
        const data = await salesRepository.findWhere(idTenant, idBranch, [], { field: 'saleDate', direction: 'desc' }, limit);
        return data.filter(s => !s.deletedAt);
    },

    /**
     * Exclui uma venda (Soft Delete)
     * Regra: Só permite se não houver recebíveis JÁ PAGOS.
     */
    deleteSale: async (idTenant, idBranch, userId, idSale) => {
        const sale = await salesRepository.findById(idTenant, idBranch, idSale)
        if (!sale) throw new Error("Venda não encontrada")

        // 1. CHECK: Existem pagamentos já realizados ou baixas?
        if ((parseFloat(sale.totalPaid) || 0) > 0.01) {
            throw new Error("SEGURANÇA: Esta venda já possui pagamentos registrados (Dinheiro, PIX ou Cartão). Não é possível excluir uma venda com movimentação financeira. Sugestão: Cancele a venda para gerar os estornos necessários.")
        }

        const { receivableRepository } = await import('../../data/repositories/ReceivableRepository')
        const receivables = await receivableRepository.findWhere(idTenant, idBranch, [['idSale', '==', idSale]])

        const hasPaid = receivables.some(r => r.status === 'paid' || (parseFloat(r.paid) || 0) > 0)
        if (hasPaid) {
            throw new Error("SEGURANÇA: Esta venda possui títulos já liquidados. Estorne os recebimentos antes de excluir.")
        }

        // 2. Soft Delete na Venda
        await salesRepository.softDelete(idTenant, idBranch, idSale, userId)

        // 3. Soft Delete nos Recebíveis pendentes
        for (const rec of receivables) {
            await receivableRepository.softDelete(idTenant, idBranch, rec.id, userId)
        }

        // 4. Estorno Contábil — Reverte o lançamento de receita da DRE
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.createCancellationDeductionEntry(idTenant, idBranch, {
                contractId: sale.id,
                clientName: sale.clientName || 'Cliente',
                saleNumber: sale.saleNumber,
                amount: sale.total
            }),
            { sourceType: 'sale_reversal', sourceId: idSale, operation: 'createCancellationDeductionEntry' }
        )

        // 5. Auditoria
        await SalesAuditLogger.logSaleDeleted({
            idTenant, idBranch, userId,
            sale
        })

        return { success: true }
    },

    calculateSaleStatus: (sale, receivables = []) => {
        // Delega a lógica de negócio para o SalesRules (SSOT de Vendas)
        return SalesRules.calculateSaleStatus(sale, receivables);
    }
}
