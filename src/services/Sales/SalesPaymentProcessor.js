import moment from 'moment'
import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { acquirerRepository } from '../../data/repositories/AcquirerRepository'
import { CashierService } from '../Financial/CashierService'
import { LedgerService } from '../Ledger/LedgerService'
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
            clientName: sale.clientName, // ✅ Novo: Identificação do cliente no caixa
            userName: sale.sellerName // Garante Snapshot para Auditoria
        })

        // 2. Contabilidade (LedgerService)
        await LedgerService.registerSalePayment(idTenant, idBranch, {
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            paymentMethod: 'money',
            amount: pValue
        });
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
            clientName: sale.clientName, // ✅ Novo: Identificação do cliente no caixa
            metadata: { shouldBeBankTransaction: true },
            userName: sale.sellerName // Garante Snapshot para Auditoria
        })

        // 2. Contabilidade
        await LedgerService.registerSalePayment(idTenant, idBranch, {
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            paymentMethod: 'pix',
            amount: pValue
        });
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
        // Se houver lógica de "Juros para o Cliente", deve ser calculado ANTES e o updated 'pValue' viria maior.
        // Aqui assumimos que 'pValue' é o valor final cobrado.

        const valuePerInstallment = pValue / numInstallments
        const receivables = []

        for (let i = 1; i <= numInstallments; i++) {
            // Cálculo proporcional da taxa
            // Ex: 100 reais, 10% taxa. Parcela de 50 (taxa 5). Líquido 45.
            const feeAmount = (valuePerInstallment * feePercentage) / 100
            const netAmount = valuePerInstallment - feeAmount

            // Calcular vencimento
            const settlementDays = activeAcquirer?.settlementDays || 30;
            const daysToAdd = payment.methodId === 'debit_card'
                ? 1  // Débito = D+1
                : (settlementDays * i); // Crédito = D+settlementDays * i

            const dueDate = normalizeDate(moment().add(daysToAdd, 'days'));

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
                feeAmount: feeAmount,
                netAmount: netAmount,       // Líquido esperado
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

                description: `Parcela ${i}/${numInstallments} - ${activeAcquirer?.name || payment.provider} ${payment.brand} (Venda #${sale.saleNumber})`,
                createdAt: normalizeDate(new Date())
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
            userName: sale.sellerName
        })

        // 5. Registrar Despesa de Taxas (Para cálculo correto de Lucro Líquido)
        const totalFee = receivables.reduce((acc, rec) => acc + (rec.feeAmount || 0), 0);

        if (totalFee > 0) {
            await CashierService.registerMovement(idTenant, idBranch, userId, {
                type: 'expense',
                amount: totalFee,
                netAmount: totalFee,
                category: 'Taxas Financeiras',
                chartOfAccountId: '2.5.3', // Conta padrão para taxas de cartão em STANDARD_ACCOUNTS
                method: payment.methodId,
                description: `Taxas de Cartão - Venda #${sale.saleNumber}`,
                saleNumber: sale.saleNumber,
                clientName: clientData.clientName,
                userName: sale.sellerName
            });
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
            createdAt: normalizeDate(new Date())
        })
    }
}
