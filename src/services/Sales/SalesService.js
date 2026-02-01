import { salesRepository } from '../../data/repositories/SalesRepository'
import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { acquirerRepository } from '../../data/repositories/AcquirerRepository'
import { contractRepository } from '../../data/repositories/ContractRepository'
import { CashierService } from '../Financial/CashierService'
import { AuditService } from '../Audit/AuditService'
import { LedgerService } from '../Ledger/LedgerService'
import { SaleSchema } from '../../data/schemas/Financial/SaleSchema'
import { generateSaleId } from '../../utils/sequence'
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
            saleDate: rawSaleData.saleDate ? new Date(rawSaleData.saleDate) : new Date(),
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
            friendlyId: saleNumber, // friendlyId = saleNumber
            status: saleData.balance > 0 ? 'partial' : 'completed',
            createdAt: new Date()
        })



        // 5. Processar cada pagamento recebido
        if (saleData.payments && saleData.payments.length > 0) {
            for (const payment of saleData.payments) {
                const pValue = parseFloat(payment.value) || 0;

                if (payment.methodId === 'dinheiro') {
                    // DINHEIRO: Regime de Caixa - Entrada imediata no caixa físico
                    await CashierService.registerMovement(idTenant, idBranch, userId, {
                        type: 'income',
                        amount: pValue,
                        netAmount: pValue,
                        category: 'sale',
                        method: 'dinheiro',
                        description: `Pgto Venda #${newSale.saleNumber || newSale.id.substring(0, 6)} - Dinheiro`,
                        idSale: newSale.id,
                        saleNumber: newSale.saleNumber
                    })

                    // CONTABILIDADE: Baixar Recebível "A Vista" (D: Caixa, C: Recebível)
                    await LedgerService.registerSalePayment(idTenant, idBranch, {
                        saleId: newSale.id,
                        saleNumber: newSale.saleNumber,
                        paymentMethod: 'dinheiro',
                        amount: pValue
                    });

                } else if (payment.methodId === 'pix') {
                    // PIX: Vai direto para conta bancária, NÃO para caixa físico
                    // TODO: Implementar BankAccountService.registerTransaction
                    // Por enquanto, registramos no caixa mas com método 'pix' para diferenciar
                    await CashierService.registerMovement(idTenant, idBranch, userId, {
                        type: 'income',
                        amount: pValue,
                        netAmount: pValue,
                        category: 'sale',
                        method: 'pix',
                        description: `Pgto Venda #${newSale.saleNumber || newSale.id.substring(0, 6)} - PIX`,
                        idSale: newSale.id,
                        saleNumber: newSale.saleNumber,
                        metadata: { shouldBeBankTransaction: true } // Flag para migração futura
                    })

                    // CONTABILIDADE: Baixar Recebível "A Vista" (D: Banco/Caixa, C: Recebível)
                    await LedgerService.registerSalePayment(idTenant, idBranch, {
                        saleId: newSale.id,
                        saleNumber: newSale.saleNumber,
                        paymentMethod: 'pix',
                        amount: pValue
                    });

                } else if (['cartao_debito', 'cartao_credito'].includes(payment.methodId)) {
                    // CARTÃO: Regime de Competência -> Recebíveis com Taxas
                    let feePercentage = 2.5;

                    try {
                        const activeAcquirers = await acquirerRepository.findActive(idTenant, idBranch)
                        const activeAcquirer = activeAcquirers.find(a => a.name === payment.provider)

                        if (activeAcquirer) {
                            let targetFees = activeAcquirer.fees

                            if (activeAcquirer.rateConfigs && Array.isArray(activeAcquirer.rateConfigs)) {
                                const brandConfig = activeAcquirer.rateConfigs.find(c => c.brands && c.brands.includes(payment.brand))
                                if (brandConfig && brandConfig.fees) {
                                    targetFees = brandConfig.fees
                                }
                            }

                            if (targetFees) {
                                if (payment.methodId === 'cartao_debito') {
                                    feePercentage = parseFloat(targetFees.debitCard) || 1.9
                                } else {
                                    const instKey = `creditCard${payment.installments || 1}x`
                                    feePercentage = parseFloat(targetFees[instKey]) || 3.5
                                }
                            }
                        }
                    } catch (err) {
                        console.warn("Usando taxa padrão devido a erro na busca de adquirente:", err);
                    }

                    // CORREÇÃO CRÍTICA: Loop de parcelas para cartão parcelado
                    const numInstallments = parseInt(payment.installments) || 1;
                    const valuePerInstallment = pValue / numInstallments;

                    for (let i = 1; i <= numInstallments; i++) {
                        const feeAmount = (valuePerInstallment * feePercentage) / 100;
                        const netAmount = valuePerInstallment - feeAmount;

                        // Calcular data de vencimento
                        const daysToAdd = payment.methodId === 'cartao_debito'
                            ? 1  // D+1 para débito
                            : (30 * i); // D+30, D+60, D+90... para crédito

                        const dueDate = moment().add(daysToAdd, 'days').toDate();

                        await receivableRepository.create(idTenant, idBranch, {
                            idSale: newSale.id,
                            saleNumber: newSale.saleNumber,
                            idClient: saleData.idClient,
                            clientName: saleData.clientName,
                            friendlyId: saleData.friendlyId || '',

                            // NOVO: Tipo de recebível (risco ZERO)
                            type: 'acquirer',

                            // NOVO: Controle de parcelas
                            installmentNumber: i,
                            totalInstallments: numInstallments,

                            // Valores detalhados
                            grossAmount: valuePerInstallment,
                            feeAmount: feeAmount,
                            netAmount: netAmount,
                            amount: valuePerInstallment,
                            paid: 0,
                            pending: valuePerInstallment,

                            dueDate: dueDate,
                            settlementDate: null,
                            paymentMethod: payment.methodId,
                            status: 'open',

                            // Informações da adquirente
                            idAcquirer: payment.idAcquirer || null,
                            provider: payment.provider,
                            brand: payment.brand,
                            authCode: payment.auth,

                            description: `Parcela ${i}/${numInstallments} - ${payment.provider} ${payment.brand}`,
                            createdAt: new Date()
                        })
                    }
                }
            }
        }

        // 5. Saldo Remanescente (Contas a Receber direto do cliente - RISCO ALTO)
        if (saleData.balance > 0) {
            await receivableRepository.create(idTenant, idBranch, {
                idSale: newSale.id,
                saleNumber: newSale.saleNumber,
                idClient: saleData.idClient,
                clientName: saleData.clientName,
                friendlyId: saleData.friendlyId || '',

                // NOVO: Tipo cliente (RISCO)
                type: 'client',

                installmentNumber: 1,
                totalInstallments: 1,

                grossAmount: saleData.balance,
                feeAmount: 0,
                netAmount: saleData.balance,
                amount: saleData.balance,
                paid: 0,
                pending: saleData.balance,

                dueDate: moment(saleData.dueDateBalance).toDate(),
                settlementDate: null,
                paymentMethod: 'pending_payment',
                status: 'open',

                description: `Saldo devedor da Venda #${newSale.saleNumber || newSale.id.substring(0, 6)}`,
                createdAt: new Date()
            })
        }


        // 7. Gerar Contratos do Cliente e Atualizar Status (Nova Arquitetura)
        // Usa ClientContractService para garantir transações atômicas
        console.log('🔍 [DEBUG] Verificando items da venda:', saleData.items)

        if (saleData.items && saleData.items.length > 0) {
            const { ClientContractService } = await import('../Clients/ClientContractService')

            for (const item of saleData.items) {
                console.log(`🔍 [DEBUG] Item: ${item.name}, Tipo: "${item.type}"`)

                // Aceita: contract, contrato, service (contratos vêm como "service" do banco)
                if (item.type === 'contract' || item.type === 'contrato') {
                    console.log(`✅ [DEBUG] Item identificado como contrato! Criando...`)
                    try {
                        // Buscar detalhes do template do contrato
                        const contractTemplate = await contractRepository.findById(idTenant, idBranch, String(item.idItem))

                        if (contractTemplate) {
                            // Calcular datas com base no template
                            const startDate = moment().toDate()
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
                                planName: item.name || contractTemplate.title,
                                planType,
                                startDate,
                                endDate,
                                value: parseFloat(item.unitPrice) || 0,
                                installments: 1,
                                status: 'active'
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
        // Classificar receita baseada nos itens
        let revenueId = '1.1.2' // Default: Serviços
        let revenueName = 'Prestação de Serviços'

        const hasProduct = saleData.items?.some(i => i.type === 'product' || i.type === 'produto')
        const hasService = saleData.items?.some(i => i.type === 'service' || i.type === 'servico' || i.type === 'contract' || i.type === 'contrato')

        if (hasProduct && !hasService) {
            revenueId = '1.1.1'
            revenueName = 'Venda de Produtos'
        } else if (hasService) {
            // Se for contrato recorrente é Mensalidade
            if (saleData.items?.some(i => i.type === 'contract' || i.type === 'contrato')) {
                revenueId = '1.1.3'
                revenueName = 'Mensalidades/Assinaturas'
            } else {
                revenueId = '1.1.2'
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
        return await salesRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deleted', '==', false]],
            { field: 'saleDate', direction: 'desc' }
        );
    }
}
