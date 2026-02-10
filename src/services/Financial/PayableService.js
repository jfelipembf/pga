import { payableRepository } from '../../data/repositories/PayableRepository'
import { bankAccountRepository } from '../../data/repositories/BankAccountRepository'
import { CashierService } from './CashierService'
import { AuditService } from '../Core/AuditService'
import { PayableSchema } from '../../data/schemas/Financial/PayableSchema'
import { generatePayableId } from '../../utils/sequence'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Contas a Pagar (Payables)
 * Integrado com sistema bancário e contábil (partidas dobradas)
 */
export const PayableService = {
    /**
     * Cria uma nova conta a pagar com validação segura e ID amigável
     * CONTABILMENTE: Registra a DESPESA (regime de competência)
     */
    createPayable: async (idTenant, idBranch, userId, payableData) => {
        await PayableSchema.validate(payableData, { abortEarly: false })

        // Gerar ID amigável (P00001)
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

        // ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        // D - Despesa (aumenta a despesa no DRE)
        // C - Contas a Pagar (aumenta o passivo no Balanço)
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.createPayableEntry(idTenant, idBranch, newPayable),
            { sourceType: 'payable', sourceId: newPayable.id, operation: 'createPayableEntry' }
        );

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: payableData.userName,
            action: 'PAYABLE_CREATED',
            entityType: 'payable',
            entityId: newPayable.id,
            description: `Nova conta a pagar registrada: ${expenseNumber} - ${payableData.description || payableData.title}`
        })

        return newPayable
    },

    /**
     * Realiza o pagamento (baixa) de uma conta com integração bancária COMPLETA
     * CONTABILMENTE: Baixa o passivo e debita o banco (regime de caixa)
     */
    payBill: async (idTenant, idBranch, userId, idPayable, paymentData) => {
        const payable = await payableRepository.findById(idTenant, idBranch, idPayable)
        if (!payable) throw new Error("Conta não encontrada")
        if (payable.status === 'paid') throw new Error("Conta já está paga")

        const { paymentDate, amount: amountPaid, paymentMethod, idBankAccount, notes } = paymentData;
        const finalAmount = parseFloat(amountPaid) || parseFloat(payable.amount);

        // 1. Validar e Buscar Conta Bancária
        if (!idBankAccount) throw new Error("Conta bancária de origem não informada");
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount) throw new Error("Conta bancária não encontrada");

        // Verificar saldo suficiente
        const currentBalance = Number(bankAccount.currentBalance || 0);
        if (currentBalance < finalAmount) {
            throw new Error(`Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}, Necessário: R$ ${finalAmount.toFixed(2)}`);
        }

        // 2. Registrar no Caixa (Sessão Diária)
        // Isso garante que a despesa apareça no extrato do dia e atualize os totais (e gaveta se for dinheiro)
        const paymentDateObj = normalizeDate(paymentDate);
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'expense',
            amount: finalAmount,
            netAmount: finalAmount,
            category: payable.chartOfAccountName || 'Despesas Gerais',
            method: paymentMethod,
            description: `Pagamento - ${payable.supplier || 'Fornecedor'} - ${payable.description || payable.title}`,
            idBankAccount: idBankAccount,
            idSource: idPayable,
            sourceType: 'payable',
            notes: notes || '',
            supplier: payable.supplier,
            userName: paymentData.userName
        })

        // 3. DEBITAR Saldo Bancário (ATÔMICO via increment)
        await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, -finalAmount);

        // 4. ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        // D - Contas a Pagar (baixa o passivo)
        // C - Banco (saída de dinheiro)
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.payPayableEntry(idTenant, idBranch, payable, {
                ...paymentData,
                amount: finalAmount,
                bankAccountName: bankAccount.name
            }),
            { sourceType: 'payable', sourceId: idPayable, operation: 'payPayableEntry' }
        );

        // 5. Atualizar Status do Payable
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
        await AuditService.log({
            idTenant, idBranch, userId,
            userName: paymentData.userName,
            action: 'PAYABLE_PAID',
            entityType: 'payable',
            entityId: idPayable,
            description: `Conta paga: ${payable.expenseNumber || idPayable}. Valor: R$ ${finalAmount.toFixed(2)} via ${paymentMethod}`
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
     * Lista contas a pagar com filtros aplicados no banco
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 50) => {
        const whereClauses = [];

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(['status', '==', filters.status]);
        }

        if (filters.category && filters.category !== 'all') {
            whereClauses.push(['category', '==', filters.category]);
        }

        // Datas (espera string YYYY-MM-DD ou Date object)
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            // Ajustar para início do dia se for string simples, ou garantir Date
            if (typeof filters.startDate === 'string') {
                // Ajuste simples para evitar fuso? melhor usar split se for YYYY-MM-DD puro
                // Mas assumindo input type="date", vem YYYY-MM-DD.
                // Criando com T00:00:00 local
                const parts = filters.startDate.split('-');
                start.setFullYear(parts[0], parts[1] - 1, parts[2]);
                start.setHours(0, 0, 0, 0);
            }
            whereClauses.push(['dueDate', '>=', start]);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            if (typeof filters.endDate === 'string') {
                const parts = filters.endDate.split('-');
                end.setFullYear(parts[0], parts[1] - 1, parts[2]);
                end.setHours(23, 59, 59, 999);
            }
            whereClauses.push(['dueDate', '<=', end]);
        }

        const rawData = await payableRepository.findWhere(idTenant, idBranch,
            whereClauses,
            { field: 'dueDate', direction: 'asc' },
            limitCount
        );

        // Filtro em memória (Robustez contra falta de índice composto deletedAt + dueDate)
        return rawData.filter(p => !p.deletedAt);
    },

    /**
     * Atualiza uma conta existente
     */
    updatePayable: async (idTenant, idBranch, userId, id, data) => {
        // 1. Snapshot Anterior
        const oldData = await payableRepository.findById(idTenant, idBranch, id)

        // 2. Persistir
        const result = await payableRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        // 3. Auditoria com Diff
        await AuditService.logUpdate({
            idTenant,
            idBranch,
            userId,
            userName: data.userName,
            entityType: 'payable',
            entityId: id,
            oldData,
            newData: data,
            description: `Atualizou a conta a pagar ${oldData?.description || id}`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deletePayable: async (idTenant, idBranch, userId, idPayable) => {
        const payable = await payableRepository.findById(idTenant, idBranch, idPayable)
        if (!payable) throw new Error("Conta não encontrada")

        if (payable.status === 'paid') {
            throw new Error("SEGURANÇA: Não é possível excluir uma conta que já foi paga. Estorne o pagamento primeiro.")
        }

        const result = await payableRepository.softDelete(idTenant, idBranch, idPayable, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYABLE_DELETED',
            entityType: 'payable',
            entityId: idPayable,
            description: `Conta a pagar excluída (soft delete): ${payable.expenseNumber || idPayable}`,
            details: {
                snapshot: payable
            }
        })

        return result
    }
}
