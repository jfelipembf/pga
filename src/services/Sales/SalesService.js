import { salesRepository } from '../../data/repositories/SalesRepository'
import { contractRepository } from '../../features/clients'
import { AuditService } from '../Audit/AuditService'
import { LedgerService, STANDARD_ACCOUNTS } from '../Ledger/LedgerService'
import { SalesPaymentProcessor } from './SalesPaymentProcessor'
import { SaleSchema } from '../../data/schemas/Financial/SaleSchema'
import { generateSaleId } from '../../utils/sequence'
import { normalizeDate } from '../../utils/date'
import moment from 'moment'

/**
 * Serviço de Vendas - Decoupled & Organized
 */
export const SalesService = {
    /**
     * Processa uma venda completa seguindo os princípios de Imutabilidade e Partidas Dobradas.
     */
    processSale: async (idTenant, idBranch, userId, rawSaleData) => {
        // 1. Validar Schema da Venda (Rigorous Validation)
        await SaleSchema.validate(rawSaleData, { abortEarly: false })

        // 2. Garantir tipagem segura para cálculos financeiros (Anti-NaN)
        const saleData = {
            ...rawSaleData,
            saleDate: normalizeDate(rawSaleData.saleDate) || new Date(),
            subtotal: parseFloat(rawSaleData.subtotal) || 0,
            total: parseFloat(rawSaleData.total) || 0,
            totalPaid: parseFloat(rawSaleData.totalPaid) || 0,
            balance: parseFloat(rawSaleData.balance) || 0
        };

        // 2.5. VALIDAÇÃO CRÍTICA: Soma dos pagamentos deve bater com o total
        // 2.5. VALIDAÇÃO CRÍTICA: Soma dos pagamentos + saldo remanescente deve bater com o total
        if (saleData.payments && saleData.payments.length > 0) {
            const sumPayments = saleData.payments.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
            const totalAccounting = sumPayments + (saleData.balance || 0);
            const expectedTotal = saleData.total - (saleData.discount || 0);

            // Tolerância de 1 centavo para evitar problemas de arredondamento
            if (Math.abs(totalAccounting - expectedTotal) > 0.01) {
                throw new Error(
                    `Inconsistência Financeira: Pagamentos (R$ ${sumPayments.toFixed(2)}) + Saldo (R$ ${saleData.balance?.toFixed(2)}) difere do Total (R$ ${expectedTotal.toFixed(2)})`
                );
            }
        }

        // 3. Gerar número de venda amigável sequencial (ex: V00001, V00002)
        const saleNumber = await generateSaleId(idTenant, idBranch);

        // 4. Salvar o documento principal da Venda
        const newSale = await salesRepository.create(idTenant, idBranch, {
            ...saleData,
            saleNumber: saleNumber,
            friendlyId: saleNumber,
            status: saleData.balance > 0.01 ? 'partial' : 'paid',
            createdBy: userId, // ✅ Fundamental para o Dashboard Operacional
            createdAt: new Date(),
            deletedAt: null
        })



        // 5. Processar cada pagamento recebido (Delegado para SalesPaymentProcessor)
        if (saleData.payments && saleData.payments.length > 0) {
            // Import dinâmico ou estático - assumindo estático
            for (const payment of saleData.payments) {
                if (payment.methodId === 'dinheiro') {
                    await SalesPaymentProcessor.processCashPayment(idTenant, idBranch, userId, newSale, payment);
                } else if (payment.methodId === 'pix') {
                    await SalesPaymentProcessor.processPixPayment(idTenant, idBranch, userId, newSale, payment);
                } else if (['cartao_debito', 'cartao_credito'].includes(payment.methodId)) {
                    await SalesPaymentProcessor.processCardPayment(idTenant, idBranch, newSale, payment, {
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
                    // Mas 'pix' e 'dinheiro' estão cobertos. Se vier 'boleto', hoje ele é ignorado.
                    // Vamos implementar um GenericPayment ou lançar erro.
                    throw new Error(`Método de pagamento não suportado ou não implementado: ${payment.methodId}`);
                }
            }
        }

        // 6. Saldo Remanescente (Contas a Receber direto do cliente)
        // 6. Saldo Remanescente (Contas a Receber direto do cliente)
        if (saleData.balance > 0) {
            console.log(`[SalesService] Processando saldo devedor. Valor: ${saleData.balance}`);

            // Robust Date Handling
            let balanceDate;
            if (saleData.dueDateBalance) {
                balanceDate = saleData.dueDateBalance;
            } else if (saleData.firstPaymentDate) {
                balanceDate = saleData.firstPaymentDate;
            } else {
                console.warn("[SalesService] Data de vencimento do saldo não informada. Usando fallback (30 dias).");
                balanceDate = moment().add(30, 'days').toDate();
            }

            // Garantir que é Date
            balanceDate = normalizeDate(balanceDate);

            console.log(`[SalesService] Data Vencimento Definida: ${balanceDate}`);

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
            const { ClientContractService } = await import('../../features/clients')

            for (const item of saleData.items) {
                const itemType = String(item.type || '').toLowerCase();

                if (itemType === 'contract' || itemType === 'contrato') {
                    try {
                        // Buscar detalhes do template do contrato
                        const contractTemplate = await contractRepository.findById(idTenant, idBranch, String(item.idItem))

                        if (contractTemplate) {
                            // Calcular datas com base no template
                            const startDate = normalizeDate(item.startDate) || new Date()
                            const duration = parseInt(contractTemplate.duration) || 12
                            const durationType = contractTemplate.durationType || 'months'

                            let endDate
                            let planType = 'monthly' // Default

                            if (durationType === 'days' || durationType === 'Dias') {
                                endDate = moment().add(duration, 'days').toDate()
                                planType = 'single'
                            } else if (durationType === 'weeks' || durationType === 'Semanas') {
                                endDate = moment().add(duration, 'weeks').toDate()
                            } else if (durationType === 'years' || durationType === 'Anos') {
                                endDate = moment().add(duration, 'years').toDate()
                                planType = 'annual'
                            } else {
                                endDate = moment().add(duration, 'months').toDate()
                                // Determina tipo baseado na duração
                                if (duration === 1) planType = 'monthly'
                                else if (duration === 3) planType = 'quarterly'
                                else if (duration === 6) planType = 'semiannual'
                                else if (duration === 12) planType = 'annual'
                            }

                            // Usa o novo ClientContractService (com transações)
                            await ClientContractService.create(idTenant, idBranch, userId, {
                                idClient: saleData.idClient,
                                idSale: newSale.id,
                                idPlan: item.idItem,
                                idContractTemplate: item.idItem, // Padronização com o Schema
                                planName: item.name || contractTemplate.title,
                                planType,
                                startDate,
                                endDate,
                                value: parseFloat(item.unitPrice) || 0,
                                installments: 1,
                                status: 'active',
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

                            console.log(`✅ Contrato criado e cliente atualizado para 'active'`)
                        } else {
                            console.warn(`⚠️ [DEBUG] Template de contrato não encontrado para idItem: ${item.idItem}`)
                        }
                    } catch (err) {
                        console.error(`❌ Erro ao criar contrato para ${item.name}:`, err)
                        // Não aborta a venda, mas registra o erro
                    }
                } else {
                    console.log(`⏭️ [DEBUG] Item "${item.name}" NÃO é contrato (tipo: "${item.type}")`)
                }
            }
        } else {
            console.warn('⚠️ [DEBUG] Nenhum item encontrado na venda!')
        }

        // 8. ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        // Classificar receita baseada nos itens usando o padrão do LedgerService
        let revenueId = STANDARD_ACCOUNTS.SERVICE_REVENUE
        let revenueName = 'Prestação de Serviços'

        const hasProduct = saleData.items?.some(i => i.type === 'product' || i.type === 'produto')
        const hasService = saleData.items?.some(i => i.type === 'service' || i.type === 'servico' || i.type === 'contract' || i.type === 'contrato')

        if (hasProduct && !hasService) {
            revenueId = STANDARD_ACCOUNTS.PRODUCT_REVENUE
            revenueName = 'Venda de Produtos'
        } else if (hasService) {
            // Se for contrato recorrente é Mensalidade
            if (saleData.items?.some(i => i.type === 'contract' || i.type === 'contrato')) {
                revenueId = STANDARD_ACCOUNTS.SUBSCRIPTION_REVENUE
                revenueName = 'Mensalidades/Assinaturas'
            } else {
                revenueId = STANDARD_ACCOUNTS.SERVICE_REVENUE
                revenueName = 'Prestação de Serviços'
            }
        }
        // Se for misto, mantém o default (Serviços) ou poderíamos criar rateio (futuro)

        try {
            await LedgerService.createSaleEntry(idTenant, idBranch, {
                ...newSale,
                total: saleData.total, // Garantir total correto
                revenueAccountId: revenueId,
                revenueAccountName: revenueName
            })
        } catch (ledgerError) {
            console.error("Erro ao criar lançamento contábil de venda:", ledgerError)
        }

        // 6. Auditoria (Rastreabilidade total)
        await AuditService.log({
            idTenant, idBranch, userId,
            userName: saleData.sellerName,
            action: 'SALE_PROCESSED',
            entityType: 'sale',
            entityId: newSale.id,
            description: `Venda #${newSale.saleNumber} concluída para ${saleData.clientName}. Pago: R$${saleData.totalPaid}`,
            details: {
                total: saleData.total,
                balance: saleData.balance,
                itemsCount: saleData.items.length
            }
        })

        return newSale
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

        // 4. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'SALE_DELETED',
            entityType: 'sale',
            entityId: idSale,
            description: `Venda #${sale.saleNumber} excluída (soft delete). Todos os títulos em aberto foram removidos.`
        })

        return { success: true }
    },

    /**
     * Define o status real de uma venda cruzando com seus recebíveis.
     * Esta é a "Fonte Única de Verdade" para o status da venda.
     */
    calculateSaleStatus: (sale, receivables = []) => {
        // Se a venda já foi cancelada, permanece cancelada
        if (sale.status === 'cancelled') return 'cancelled';

        // Filtra recebíveis que pertencem a esta venda e são responsabilidade do cliente
        const clientReceivables = receivables.filter(r =>
            r.idSale === sale.id &&
            (r.type === 'client' || r.paymentMethod === 'pending_payment')
        );

        // Se não houver recebíveis de cliente, e o status original não for falho, é pago
        if (clientReceivables.length === 0) return 'paid';

        // Verifica se ainda existe algum valor pendente
        const totalPending = clientReceivables.reduce((sum, r) => sum + (r.status === 'open' ? (parseFloat(r.pending) || 0) : 0), 0);

        return totalPending > 0.01 ? 'partial' : 'paid';
    }
}
