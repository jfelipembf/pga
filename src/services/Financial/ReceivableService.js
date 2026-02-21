import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import { CashierService } from './CashierService'
import { ReceivableAuditLogger } from './audit/ReceivableAuditLogger'
import { ReceivableRules } from './domain/ReceivableRules'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'


/**
 * Serviço para Gestão de Contas a Receber (Receivables)
 */
export const ReceivableService = {
    /**
     * Liquida um recebível (Baixa de pagamento)
     */
    settleReceivable: async (idTenant, idBranch, userId, idReceivable, paymentData) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        ReceivableRules.validateForSettlement(receivable)

        const { settlementAmount, feeAmount, netAmount, remaining, isFullyPaid } =
            ReceivableRules.calculateSettlement(receivable, paymentData)

        // 1. Validar e Buscar Conta Bancária
        const { bankAccountRepository } = await import('../../data/repositories/BankAccountRepository')
        const idBankAccount = paymentData.idBankAccount || 'CAIXA'
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount && idBankAccount !== 'CAIXA') throw new Error("Conta bancária de destino não encontrada.");

        // 2. Registrar no Fluxo de Caixa (Income)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: settlementAmount,
            netAmount: netAmount,
            category: 'receivable_payment',
            method: paymentData.method || receivable.paymentMethod,
            description: receivable.description || `Recebimento de Título #${idReceivable.substring(0, 6)}`,
            clientName: receivable.clientName,
            idReceivable: idReceivable,
            idSale: receivable.idSale,
            idBankAccount: idBankAccount,
            skipLedger: true
        })

        // 3. Atualizar Saldo da Conta Bancária
        if (bankAccount) {
            await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, netAmount);
        }

        // 4. Atualizar o documento de Recebível
        const updatedData = {
            paid: (receivable.paid || 0) + settlementAmount,
            pending: remaining,
            status: isFullyPaid ? 'paid' : 'open',
            settlementDate: normalizeDate(paymentData.settlementDate) || normalizeDate(new Date()),
            amountReceived: netAmount,
            extraFeeAmount: feeAmount,
            idBankAccount: idBankAccount,
            paidAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        }

        await receivableRepository.update(idTenant, idBranch, idReceivable, updatedData)

        // 5. Lançamento Contábil
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.settleReceivableEntry(idTenant, idBranch, receivable, {
                grossAmount: settlementAmount,
                feeAmount: feeAmount,
                netAmount: netAmount,
                idBankAccount: idBankAccount,
                bankAccountName: bankAccount?.name || 'Caixa',
                settlementDate: updatedData.settlementDate,
                paymentMethod: paymentData.method || receivable.paymentMethod
            }),
            { sourceType: 'receivable', sourceId: idReceivable, operation: 'settleReceivableEntry' }
        );

        // 6. Auditoria
        await ReceivableAuditLogger.logSettlement({
            idTenant, idBranch, userId,
            userName: paymentData.userName,
            entityId: idReceivable,
            amount: settlementAmount,
            clientName: receivable.clientName,
            updatedData,
            method: paymentData.method
        })

        // 7. Atualização do Status da Venda
        if (receivable.idSale && updatedData.status === 'paid') {
            const otherPending = await receivableRepository.findWhere(idTenant, idBranch, [
                ['idSale', '==', receivable.idSale],
                ['status', '==', 'open'],
                ['type', '==', 'client'],
                ['deletedAt', '==', null]
            ]);

            if (otherPending.filter(p => p.id !== idReceivable).length === 0) {
                await salesRepository.update(idTenant, idBranch, receivable.idSale, {
                    status: 'paid',
                    updatedAt: normalizeDate(new Date())
                });
            }
        }

        return { id: idReceivable, ...updatedData }
    },

    /**
     * Lista todos os recebíveis com filtros
     */
    listAll: async (idTenant, idBranch, options = {}) => {
        const { startDate, endDate, limit = 50 } = options;
        const filters = [];

        if (startDate) {
            const start = normalizeDate(startDate);
            if (start) filters.push(['dueDate', '>=', start]);
        }
        if (endDate) {
            const end = normalizeDate(endDate);
            if (end) filters.push(['dueDate', '<=', end]);
        }

        const rawData = await receivableRepository.findWhere(
            idTenant, idBranch,
            filters,
            { field: 'dueDate', direction: 'desc' },
            limit
        );

        return rawData.filter(r => !r.deletedAt);
    },

    /**
     * Obtém o resumo financeiro consolidado de um cliente.
     */
    getSummaryByClient: async (idTenant, idBranch, idClient) => {
        const { FinancialCalculator } = await import('./Core/FinancialCalculator');

        const [receivables, sales] = await Promise.all([
            receivableRepository.findWhere(idTenant, idBranch, [
                ['idClient', '==', idClient],
                ['status', '!=', 'cancelled'],
                ['deletedAt', '==', null]
            ]),
            salesRepository.findWhere(idTenant, idBranch, [
                ['idClient', '==', idClient]
            ])
        ]);

        return FinancialCalculator.calculateClientSummary(sales, receivables);
    },

    /**
     * Lista recebíveis de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        return await receivableRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deletedAt', '==', null]],
            { field: 'dueDate', direction: 'desc' }
        );
    },

    /**
     * Cancela um recebível
     */
    cancelReceivable: async (idTenant, idBranch, userId, idReceivable, reason) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        ReceivableRules.validateForCancellation(receivable)

        await receivableRepository.update(idTenant, idBranch, idReceivable, {
            status: 'cancelled',
            description: `Cancelado: ${reason}`,
            updatedAt: normalizeDate(new Date())
        })

        await ReceivableAuditLogger.logCancellation({
            idTenant, idBranch, userId,
            entityId: idReceivable,
            reason
        })
    },

    /**
     * Soft Delete
     */
    deleteReceivable: async (idTenant, idBranch, userId, idReceivable) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        ReceivableRules.validateForDeletion(receivable)

        await receivableRepository.softDelete(idTenant, idBranch, idReceivable, userId)

        await ReceivableAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: idReceivable,
            description: receivable.description,
            snapshot: receivable
        })
    },

    /**
     * Antecipação de Recebíveis (Bulk)
     */
    anticipateReceivables: async (idTenant, idBranch, userId, data) => {
        const { receivableIds, idBankAccount, anticipationFee, totalNet, totalGross, totalExtraFee, settlementDate, userName } = data;

        const { bankAccountRepository } = await import('../../data/repositories/BankAccountRepository')
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount) throw new Error("Conta não encontrada");

        const { transactionRepository } = await import('../../data/repositories/TransactionRepository')

        for (const id of receivableIds) {
            const rawRec = await receivableRepository.findById(idTenant, idBranch, id);
            const gross = parseFloat(rawRec.amount) || 0;
            const feeShare = gross * (anticipationFee / 100);
            const netShare = gross - feeShare;

            await receivableRepository.update(idTenant, idBranch, id, {
                status: 'paid',
                settlementDate: settlementDate,
                amountReceived: netShare,
                extraFeeAmount: feeShare,
                idBankAccount,
                notes: `Antecipado via Bulk. Taxa: ${anticipationFee}%`,
                updatedAt: normalizeDate(new Date())
            });

            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.settleReceivableEntry(idTenant, idBranch, rawRec, {
                    grossAmount: gross,
                    feeAmount: feeShare,
                    netAmount: netShare,
                    idBankAccount: idBankAccount,
                    bankAccountName: bankAccount.name,
                    settlementDate: normalizeDate(settlementDate)
                }),
                { sourceType: 'receivable', sourceId: id, operation: 'settleReceivableEntry_anticipation' }
            );
        }

        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Antecipação (Valor Bruto) - ${receivableIds.length} títulos`,
            amount: totalGross,
            type: 'income',
            category: 'Movimentação Interna (Antecipação)',
            idBankAccount,
            sourceType: 'receivable_bulk',
            idCashierSession: null,
            systemGenerated: true,
            skipLedger: true,
            createdAt: normalizeDate(new Date()),
            userName: userName
        });

        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Taxa de Antecipação - ${anticipationFee}%`,
            amount: totalExtraFee,
            type: 'expense',
            category: 'Taxa de Antecipação',
            idBankAccount,
            sourceType: 'receivable_fee',
            idCashierSession: null,
            systemGenerated: true,
            skipLedger: true,
            createdAt: normalizeDate(new Date()),
            userName: userName
        });

        await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, Number(totalNet));

        await ReceivableAuditLogger.logAnticipation({
            idTenant, idBranch, userId, userName,
            receivableIds,
            anticipationFee,
            totalNet, totalGross, totalExtraFee
        });

        return { totalNet, count: receivableIds.length };
    }
}
