import { payableRepository } from '../../data/repositories/PayableRepository'
import { bankAccountRepository } from '../../data/repositories/BankAccountRepository'
import { CashierService } from './CashierService'
import { PayableAuditLogger } from './audit/PayableAuditLogger'
import { PayableRules } from './domain/PayableRules'
import { PayableSchema } from '../../data/schemas/Financial/PayableSchema'
import { generatePayableId } from '../../utils/sequence'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate, parseDateInput } from '../../utils/date'

/**
 * Serviço para Gestão de Contas a Pagar (Payables)
 * Integrado com sistema bancário e contábil (partidas dobradas)
 */
export const PayableService = {
    /**
     * Cria uma nova conta a pagar com validação segura e ID amigável
     */
    createPayable: async (idTenant, idBranch, userId, payableData) => {
        await PayableSchema.validate(payableData, { abortEarly: false })

        const expenseNumber = await generatePayableId(idTenant, idBranch);

        const newPayable = await payableRepository.create(idTenant, idBranch, {
            ...payableData,
            expenseNumber,
            amount: parseFloat(payableData.amount) || 0,
            dueDate: normalizeDate(payableData.dueDate),
            status: payableData.status || 'open',
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            deletedAt: null
        })

        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.createPayableEntry(idTenant, idBranch, newPayable),
            { sourceType: 'payable', sourceId: newPayable.id, operation: 'createPayableEntry' }
        );

        await PayableAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: payableData.userName,
            entityId: newPayable.id,
            expenseNumber,
            description: payableData.description || payableData.title
        })

        return newPayable
    },

    /**
     * Realiza o pagamento (baixa) de uma conta com integração bancária COMPLETA
     */
    payBill: async (idTenant, idBranch, userId, idPayable, paymentData) => {
        const payable = await payableRepository.findById(idTenant, idBranch, idPayable)
        PayableRules.validateForPayment(payable)

        const { paymentDate, amount: amountPaid, paymentMethod, idBankAccount, notes } = paymentData;
        const finalAmount = parseFloat(amountPaid) || parseFloat(payable.amount);

        // 1. Validar Conta Bancária
        if (!idBankAccount) throw new Error("Conta bancária de origem não informada");
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        PayableRules.validateBankBalance(bankAccount, finalAmount);

        // 2. Registrar no Caixa
        const paymentDateObj = normalizeDate(paymentDate);
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'expense',
            amount: finalAmount,
            netAmount: finalAmount,
            category: payable.chartOfAccountName || 'Despesas Gerais',
            method: paymentMethod,
            description: `Pagamento - ${payable.supplier || 'Fornecedor'} - ${payable.description || payable.title}`,
            idBankAccount: idBankAccount,
            idPayable: idPayable,
            sourceType: 'payable',
            notes: notes || '',
            supplier: payable.supplier,
            userName: paymentData.userName,
            skipLedger: true
        })

        // 3. Debitar Saldo Bancário
        await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, -finalAmount);

        // 4. Lançamento Contábil
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.payPayableEntry(idTenant, idBranch, payable, {
                ...paymentData,
                amount: finalAmount,
                bankAccountName: bankAccount.name
            }),
            { sourceType: 'payable', sourceId: idPayable, operation: 'payPayableEntry' }
        );

        // 5. Atualizar Status
        await payableRepository.update(idTenant, idBranch, idPayable, {
            status: 'paid',
            paymentDate: paymentDateObj,
            paymentMethod: paymentMethod,
            idBankAccount: idBankAccount,
            amountPaid: finalAmount,
            paidAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        })

        // 6. Auditoria
        await PayableAuditLogger.logPayment({
            idTenant, idBranch, userId,
            userName: paymentData.userName,
            entityId: idPayable,
            expenseNumber: payable.expenseNumber,
            amount: finalAmount,
            method: paymentMethod
        })

        return { success: true };
    },

    /**
     * Lista todas as contas a pagar da unidade
     */
    listAll: async (idTenant, idBranch) => {
        const data = await payableRepository.findAll(idTenant, idBranch)
        return data.filter(p => !p.deletedAt)
    },

    /**
     * Lista contas a pagar com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 50) => {
        const whereClauses = [];

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(['status', '==', filters.status]);
        }

        if (filters.category && filters.category !== 'all') {
            whereClauses.push(['category', '==', filters.category]);
        }

        if (filters.startDate) {
            const start = parseDateInput(filters.startDate, 'start');
            whereClauses.push(['dueDate', '>=', start]);
        }

        if (filters.endDate) {
            const end = parseDateInput(filters.endDate, 'end');
            whereClauses.push(['dueDate', '<=', end]);
        }

        const rawData = await payableRepository.findWhere(idTenant, idBranch,
            whereClauses,
            { field: 'dueDate', direction: 'asc' },
            limitCount
        );

        return rawData.filter(p => !p.deletedAt);
    },

    /**
     * Atualiza uma conta existente
     */
    updatePayable: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await payableRepository.findById(idTenant, idBranch, id)

        const result = await payableRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        await PayableAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: data
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deletePayable: async (idTenant, idBranch, userId, idPayable) => {
        const payable = await payableRepository.findById(idTenant, idBranch, idPayable)
        PayableRules.validateForDeletion(payable)

        const result = await payableRepository.softDelete(idTenant, idBranch, idPayable, userId)

        await PayableAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: idPayable,
            expenseNumber: payable.expenseNumber,
            snapshot: payable
        })

        return result
    }
}
