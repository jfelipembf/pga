import moment from 'moment'
import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { acquirerRepository } from '../../data/repositories/AcquirerRepository'
import { CashierService } from '../Financial/CashierService'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'


/**
 * Processador de Pagamentos de Vendas
 * Responsável por lidar com a complexidade de cada método de pagamento (Dinheiro, PIX, Cartão).
 */
export const SalesPaymentProcessor = {

    /**
     * Processa um pagamento em DINHEIRO via CashierService + LedgerService
     */
    processCashPayment: async (idTenant, idBranch, userId, sale, payment) => {
        const pValue = parseFloat(payment.value) || 0

        // 1. Entrada no Caixa Físico (CashierService)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: pValue,
            netAmount: pValue,
            category: 'sale',
            method: 'money',
            description: `Venda #${sale.saleNumber || sale.id.substring(0, 6)}`,
            idSale: sale.id,
            saleNumber: sale.saleNumber,
            clientName: sale.clientName,
            date: sale.saleDate, // Usa a data da venda para o movimento do caixa
            userName: sale.sellerName // Garante Snapshot para Auditoria
        })

        // 2. Contabilidade (LedgerService)
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.registerSalePayment(idTenant, idBranch, {
                saleId: sale.id,
                saleNumber: sale.saleNumber,
                paymentMethod: 'money',
                amount: pValue
            }),
            { sourceType: 'sale_payment', sourceId: sale.id, operation: 'registerSalePayment_cash' }
        );
    },

    /**
     * Processa um pagamento via PIX
     */
    processPixPayment: async (idTenant, idBranch, userId, sale, payment) => {
        const pValue = parseFloat(payment.value) || 0

        // 1. Registro no Caixa (mas com método PIX - não afeta saldo físico se configurado corretamente lá, mas registra a transação)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: pValue,
            netAmount: pValue,
            category: 'sale',
            method: 'pix',
            description: `Venda #${sale.saleNumber || sale.id.substring(0, 6)}`,
            idSale: sale.id,
            saleNumber: sale.saleNumber,
            clientName: sale.clientName,
            date: sale.saleDate, // Usa a data da venda
            metadata: { shouldBeBankTransaction: true },
            userName: sale.sellerName // Garante Snapshot para Auditoria
        })

        // 2. Contabilidade
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.registerSalePayment(idTenant, idBranch, {
                saleId: sale.id,
                saleNumber: sale.saleNumber,
                paymentMethod: 'pix',
                amount: pValue
            }),
            { sourceType: 'sale_payment', sourceId: sale.id, operation: 'registerSalePayment_pix' }
        );
    },

    /**
     * Processa pagamentos via CARTÃO (Recebíveis Futuros)
     */
    processCardPayment: async (idTenant, idBranch, userId, sale, payment, clientData) => {
        const pValue = parseFloat(payment.value) || 0
        const numInstallments = parseInt(payment.installments) || 1

        let feePercentage = 0; // Default zero se erro
        let activeAcquirer = null;

        // 1. Buscar Taxas da Adquirente
        try {
            const activeAcquirers = await acquirerRepository.findActive(idTenant, idBranch)
            // Tenta achar por ID primeiro (idAcquirer), depois por ID no provider, depois por Nome
            activeAcquirer = activeAcquirers.find(a =>
                a.id === payment.idAcquirer ||
                a.id === payment.provider ||
                a.name === payment.provider
            )

            if (activeAcquirer) {
                let targetFees = activeAcquirer.fees

                // Tenta achar configuração específica da Bandeira
                if (activeAcquirer.rateConfigs && Array.isArray(activeAcquirer.rateConfigs)) {
                    const brandConfig = activeAcquirer.rateConfigs.find(c => c.brands && c.brands.includes(payment.brand))
                    if (brandConfig && brandConfig.fees) {
                        targetFees = brandConfig.fees
                    }
                }

                if (targetFees) {
                    if (payment.methodId === 'debit_card') {
                        feePercentage = parseFloat(targetFees.debitCard) || 0
                    } else {
                        // Busca taxa específica da parcela (ex: creditCard1x, creditCard2x...)
                        const instKey = `creditCard${numInstallments}x`
                        feePercentage = parseFloat(targetFees[instKey]) || 0
                    }
                }
            } else {
                console.warn(`[SalesPaymentProcessor] Adquirente '${payment.provider}' não encontrada ou inativa. Usando taxa 0%.`)
            }
        } catch (err) {
            console.error("[SalesPaymentProcessor] Erro ao buscar taxas:", err);
        }

        // 2. Cálculos Matemáticos (Parcelamento sem juros para o cliente neste fluxo, juros/taxa descontado do lojista)

        let valuePerInstallment = pValue / numInstallments
        const receivables = []

        // Verifica se há taxas base (MDR) configuradas para separar o Custo Financeiro
        // Se a adquirente for D+1 (Antecipada), tentamos identificar o spread.
        let baseFeePercentage = feePercentage; // Default: Tudo é taxa operacional
        if (activeAcquirer?.standardFees) {
            if (payment.methodId === 'debit_card') {
                baseFeePercentage = parseFloat(activeAcquirer.standardFees.debitCard) || 0
            } else {
                const instKey = `creditCard${numInstallments}x`
                let standardFee = activeAcquirer.standardFees[instKey]

                // Fallback para Grupos Simplificados (bucket) se a taxa específica não existir
                if (standardFee === undefined || standardFee === null || standardFee === 0) {
                    if (numInstallments >= 2 && numInstallments <= 6) {
                        standardFee = activeAcquirer.standardFees['creditCard2x'] // Input do formulário "2x-6x" salva aqui
                    } else if (numInstallments >= 7 && numInstallments <= 12) {
                        standardFee = activeAcquirer.standardFees['creditCard7x'] // Input do formulário "7x-12x" salva aqui
                    }
                }

                // Se achou alguma taxa base, usa. Se não, assume que é igual a total (sem custo financeiro extra).
                // Mas cuidado: parseFloat(0) é 0, que é falsey. Se standardFee for 0 explícito, base é 0.
                // Se achou alguma taxa base válida (> 0), usa.
                // Se for 0 ou não definida, assume que é igual a total (sem separação de juros).
                if (standardFee !== undefined && standardFee !== null && parseFloat(standardFee) > 0) {
                    baseFeePercentage = parseFloat(standardFee)
                } else {
                    baseFeePercentage = feePercentage
                }
            }
        }

        for (let i = 1; i <= numInstallments; i++) {
            // Cálculo proporcional da taxa Total
            const totalFeeAmount = (valuePerInstallment * feePercentage) / 100

            // Cálculo da Taxa Operacional (Base MDR)
            const operationalFeeAmount = (valuePerInstallment * baseFeePercentage) / 100

            // Cálculo da Despesa Financeira (Spread de Antecipação)
            // Se total for 9.45% e base for 1.91%, a diferença é financeiro.
            let financialFeeAmount = totalFeeAmount - operationalFeeAmount;
            if (financialFeeAmount < 0) financialFeeAmount = 0; // Proteção

            const netAmount = valuePerInstallment - totalFeeAmount

            // Calcular vencimento
            // Se for Antecipação Automática (D+1), todas as parcelas vencem amanhã.
            const settlementDays = activeAcquirer?.settlementDays || 30;
            const isAnticipated = settlementDays === 1;

            const daysToAdd = payment.methodId === 'debit_card'
                ? 1  // Débito = D+1
                : (isAnticipated ? 1 : (settlementDays * i)); // Se antecipado: D+1 fixo. Se não: 30, 60, 90...

            const dueDate = normalizeDate(moment(sale.saleDate).add(daysToAdd, 'days'));

            const receivable = {
                idSale: sale.id,
                saleNumber: sale.saleNumber,
                idClient: clientData.idClient,
                clientName: clientData.clientName,
                friendlyId: clientData.friendlyId || '',

                type: 'acquirer', // Risco Adquirente (baixo)
                installmentNumber: i,
                totalInstallments: numInstallments,

                grossAmount: valuePerInstallment,
                feeAmount: totalFeeAmount, // Mantemos o total aqui para conferência simples

                // Novos campos para detalhamento (serão salvos no banco se o schema permitir, mas úteis aqui)
                operationalFeeAmount: operationalFeeAmount,
                financialFeeAmount: financialFeeAmount,

                netAmount: netAmount,       // Líquido esperado (já descontando tudo)
                amount: valuePerInstallment, // Valor de face
                paid: 0,
                pending: valuePerInstallment,

                dueDate: dueDate,
                settlementDate: null,
                paymentMethod: payment.methodId,
                status: 'open',

                idAcquirer: activeAcquirer?.id || payment.idAcquirer || null,
                provider: activeAcquirer?.name || payment.provider,
                brand: payment.brand,
                authCode: payment.auth,

                description: `Parcela ${i}/${numInstallments} - ${activeAcquirer?.name || payment.provider} ${payment.brand} (Venda #${sale.saleNumber}) ${isAnticipated ? '[Antecipado]' : ''}`,
                createdAt: normalizeDate(sale.saleDate)
            }

            receivables.push(receivable)
        }

        // 3. Persistir Recebíveis
        for (const rec of receivables) {
            await receivableRepository.create(idTenant, idBranch, rec)
        }

        // 4. Registrar Movimentação no Caixa (Para aparecer no extrato diário)
        const brandLabel = payment.brand ? payment.brand.toUpperCase() : 'CARTÃO'
        const installmentLabel = numInstallments > 1 ? ` (${numInstallments}x)` : ''

        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: pValue,
            netAmount: pValue,
            category: 'sale',
            method: payment.methodId,
            description: `Venda #${sale.saleNumber || sale.id.substring(0, 6)} - ${activeAcquirer?.name || payment.provider} ${brandLabel}${installmentLabel}`,
            idSale: sale.id,
            saleNumber: sale.saleNumber,
            clientName: clientData.clientName,
            date: sale.saleDate,
            userName: sale.sellerName
        })

        // 5. Contabilidade: Provisão de Taxas (Regime de Competência)
        // Isso garante que a taxa apareça na DRE no mês da Venda, não apenas na Liquidação.
        const totalOperationalFees = receivables.reduce((acc, curr) => acc + (parseFloat(curr.operationalFeeAmount) || 0), 0);
        const totalFinancialFees = receivables.reduce((acc, curr) => acc + (parseFloat(curr.financialFeeAmount) || 0), 0);

        const hasFees = (totalOperationalFees + totalFinancialFees) > 0;

        if (hasFees) {
            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.createCardFeeProvisionEntry(idTenant, idBranch, {
                    saleId: sale.id,
                    saleNumber: sale.saleNumber,
                    amount: totalOperationalFees, // Passamos apenas a parte Operacional (MDR) como "amount"
                    financialFeeAmount: totalFinancialFees // Passamos o juros separado
                }),
                { sourceType: 'card_fee_provision', sourceId: sale.id, operation: 'createCardFeeProvisionEntry' }
            );
        }

        return receivables;
    },

    /**
     * Processa o Saldo Devedor (Contas a Receber Cliente)
     */
    processRemainingBalance: async (idTenant, idBranch, sale, balance, clientData, dueDateBalance) => {
        if (balance <= 0) return;

        await receivableRepository.create(idTenant, idBranch, {
            idSale: sale.id,
            saleNumber: sale.saleNumber,
            idClient: clientData.idClient,
            clientName: clientData.clientName,
            friendlyId: clientData.friendlyId || '',

            type: 'client', // Risco Cliente (Alto)
            installmentNumber: 1,
            totalInstallments: 1,

            grossAmount: balance,
            feeAmount: 0,
            netAmount: balance,
            amount: balance,
            paid: 0,
            pending: balance,

            dueDate: normalizeDate(dueDateBalance),
            settlementDate: null,
            paymentMethod: 'pending_payment',
            status: 'open',

            description: `Saldo devedor da Venda #${sale.saleNumber}`,
            createdAt: normalizeDate(sale.saleDate)
        })
    }
}
