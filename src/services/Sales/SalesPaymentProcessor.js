import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { acquirerRepository } from '../../data/repositories/AcquirerRepository'
import { CashierService } from '../Financial/CashierService'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'
import { PaymentProcessingRules } from './domain/PaymentProcessingRules'
import { SalesAuditLogger } from './audit/SalesAuditLogger'

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
            date: sale.saleDate,
            userName: sale.sellerName
        })

        // 2. Contabilidade (LedgerService)
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.registerSalePayment(idTenant, idBranch, {
                idSale: sale.id,
                saleNumber: sale.saleNumber,
                paymentMethod: 'money',
                amount: pValue,
                paymentDate: sale.saleDate
            }),
            { sourceType: 'sale_payment', sourceId: sale.id, operation: 'registerSalePayment_cash' }
        );

        // 3. Auditoria
        await SalesAuditLogger.logPaymentProcessed({
            idTenant, idBranch, userId,
            idSale: sale.id,
            method: 'money',
            amount: pValue
        });
    },

    /**
     * Processa um pagamento via PIX
     */
    processPixPayment: async (idTenant, idBranch, userId, sale, payment) => {
        const pValue = parseFloat(payment.value) || 0

        // 1. Registro no Caixa
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
            date: sale.saleDate,
            metadata: { shouldBeBankTransaction: true },
            userName: sale.sellerName
        })

        // 2. Contabilidade
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.registerSalePayment(idTenant, idBranch, {
                idSale: sale.id,
                saleNumber: sale.saleNumber,
                paymentMethod: 'pix',
                amount: pValue,
                paymentDate: sale.saleDate
            }),
            { sourceType: 'sale_payment', sourceId: sale.id, operation: 'registerSalePayment_pix' }
        );

        // 3. Auditoria
        await SalesAuditLogger.logPaymentProcessed({
            idTenant, idBranch, userId,
            idSale: sale.id,
            method: 'pix',
            amount: pValue
        });
    },

    /**
     * Processa pagamentos via CARTÃO (Recebíveis Futuros)
     */
    processCardPayment: async (idTenant, idBranch, userId, sale, payment, clientData) => {
        const pValue = parseFloat(payment.value) || 0
        const numInstallments = parseInt(payment.installments) || 1

        // 1. Resolver Adquirente e Taxas (Delegado para domain rules)
        const activeAcquirers = await acquirerRepository.findActive(idTenant, idBranch);
        const activeAcquirer = PaymentProcessingRules.resolveAcquirer(activeAcquirers, payment);

        const feePercentage = PaymentProcessingRules.resolveFeePercentage(activeAcquirer, payment, numInstallments);
        const baseFeePercentage = PaymentProcessingRules.resolveBaseFeePercentage(activeAcquirer, payment, numInstallments, feePercentage);

        // 2. Gerar Parcelas
        const valuePerInstallment = pValue / numInstallments;
        const receivables = [];

        for (let i = 1; i <= numInstallments; i++) {
            const totalFeeAmount = (valuePerInstallment * feePercentage) / 100;
            const operationalFeeAmount = (valuePerInstallment * baseFeePercentage) / 100;
            const financialFeeAmount = Math.max(0, totalFeeAmount - operationalFeeAmount);
            const netAmount = valuePerInstallment - totalFeeAmount;

            const dueDate = PaymentProcessingRules.calculateDueDate(sale.saleDate, i, payment.methodId, activeAcquirer);

            receivables.push({
                idSale: sale.id,
                saleNumber: sale.saleNumber,
                idClient: clientData.idClient,
                clientName: clientData.clientName,
                friendlyId: clientData.friendlyId || '',
                type: 'acquirer',
                installmentNumber: i,
                totalInstallments: numInstallments,
                grossAmount: valuePerInstallment,
                feeAmount: totalFeeAmount,
                operationalFeeAmount,
                financialFeeAmount,
                netAmount,
                amount: valuePerInstallment,
                paid: 0,
                pending: valuePerInstallment,
                dueDate,
                settlementDate: null,
                paymentMethod: payment.methodId,
                status: 'open',
                idAcquirer: activeAcquirer?.id || payment.idAcquirer || null,
                provider: activeAcquirer?.name || payment.provider,
                brand: payment.brand,
                authCode: payment.auth,
                description: `Parcela ${i}/${numInstallments} - ${activeAcquirer?.name || payment.provider} ${payment.brand.toUpperCase()} (Venda #${sale.saleNumber})`,
                createdAt: normalizeDate(sale.saleDate)
            });
        }

        // 3. Persistir Recebíveis
        for (const rec of receivables) {
            await receivableRepository.create(idTenant, idBranch, rec);
        }

        // 4. Auditoria de Pagamento e Registro no Caixa
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: pValue,
            netAmount: pValue,
            category: 'sale',
            method: payment.methodId,
            description: `Venda #${sale.saleNumber || sale.id.substring(0, 6)} - ${activeAcquirer?.name || payment.provider} ${payment.brand.toUpperCase()} (${numInstallments}x)`,
            idSale: sale.id,
            saleNumber: sale.saleNumber,
            clientName: clientData.clientName,
            date: sale.saleDate,
            userName: sale.sellerName
        });

        // 5. Contabilidade: Provisão de Taxas
        const totalOperationalFees = receivables.reduce((acc, curr) => acc + curr.operationalFeeAmount, 0);
        const totalFinancialFees = receivables.reduce((acc, curr) => acc + curr.financialFeeAmount, 0);

        if ((totalOperationalFees + totalFinancialFees) > 0.01) {
            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.createCardFeeProvisionEntry(idTenant, idBranch, {
                    idSale: sale.id,
                    saleNumber: sale.saleNumber,
                    amount: totalOperationalFees,
                    financialFeeAmount: totalFinancialFees,
                    date: sale.saleDate
                }),
                { sourceType: 'card_fee_provision', sourceId: sale.id, operation: 'createCardFeeProvisionEntry' }
            );
        }

        await SalesAuditLogger.logPaymentProcessed({
            idTenant, idBranch, userId,
            idSale: sale.id,
            method: payment.methodId,
            amount: pValue
        });

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
            type: 'client',
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
        });
    }
}
