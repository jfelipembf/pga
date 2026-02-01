import { salesRepository } from '../../data/repositories/SalesRepository'
import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { acquirerRepository } from '../../data/repositories/AcquirerRepository'
import { contractRepository } from '../../data/repositories/ContractRepository'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { CashierService } from '../Financial/CashierService'
import { AuditService } from '../Audit/AuditService'
import { SaleSchema } from '../../data/schemas/Financial/SaleSchema'
import { generateSaleNumber, generateDailySequential } from '../../utils/idGenerators'
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

        // 3. Gerar número de venda amigável (ex: V20250131-143025)
        const saleDate = saleData.saleDate ? new Date(saleData.saleDate) : new Date();
        const saleNumber = generateSaleNumber(saleDate, generateDailySequential(new Date()));

        // 4. Salvar o documento principal da Venda
        const newSale = await salesRepository.create(idTenant, idBranch, {
            ...saleData,
            saleNumber: saleNumber,
            friendlyId: saleData.friendlyId || '',
            status: saleData.balance > 0 ? 'partial' : 'completed',
            createdAt: new Date()
        })

        // 4. Processar cada pagamento recebido
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

        // 7. Gerar Contratos do Aluno (MemberMembership) - EVO API Pattern
        // Itera sobre os itens vendidos para ativar os contratos correspondentes
        if (saleData.items && saleData.items.length > 0) {
            for (const item of saleData.items) {
                if (item.type === 'contract' || item.type === 'contrato') { // Aceita ambas nomenclaturas por segurança
                    try {
                        // Buscar detalhes do template do contrato (duranção, regras, etc)
                        // Precisamos do ID original do template. Supomos que item.idItem seja esse ID.
                        const contractTemplate = await contractRepository.findById(idTenant, idBranch, item.idItem);

                        if (contractTemplate) {
                            const startDate = moment().toDate();
                            let endDate = moment().toDate();

                            // Calcular validade baseada no template
                            const duration = parseInt(contractTemplate.duration) || 12;
                            const durationType = contractTemplate.durationType || 'months';

                            if (durationType === 'days' || durationType === 'Dias') {
                                endDate = moment().add(duration, 'days').toDate();
                            } else if (durationType === 'weeks' || durationType === 'Semanas') {
                                endDate = moment().add(duration, 'weeks').toDate();
                            } else if (durationType === 'years' || durationType === 'Anos') {
                                endDate = moment().add(duration, 'years').toDate();
                            } else {
                                endDate = moment().add(duration, 'months').toDate();
                            }

                            await clientContractRepository.create(idTenant, idBranch, {
                                idTenant,
                                idBranch,
                                idClient: saleData.idClient,
                                idSale: newSale.id,
                                idContractTemplate: item.idItem,
                                title: item.name || contractTemplate.title,
                                startDate: startDate,
                                endDate: endDate,
                                price: item.unitPrice,
                                status: 'active',
                                accessRules: {
                                    allowedWeekDays: contractTemplate.allowedWeekDays || [],
                                    accessLimitType: contractTemplate.accessLimitType,
                                    accessLimitQuantity: contractTemplate.accessLimitQuantity
                                }
                            });
                        }
                    } catch (err) {
                        console.error(`Erro ao gerar contrato para o item ${item.name}:`, err);
                        // Não abortamos a venda se falhar a criação do contrato, mas logamos o erro crítico.
                    }
                }
            }
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
    }
}
