import { cashierRepository } from '../../data/repositories/CashierRepository'
import { transactionRepository } from '../../data/repositories/TransactionRepository'
import { AuditService } from '../Core/AuditService'
import { CashierSessionSchema, TransactionSchema } from '../../data/schemas/FinancialSchemas'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço responsável por gerenciar a "Gaveta de Caixa" (Sessões e Movimentações).
 */
export const CashierService = {
    /**
     * Abre uma nova sessão de caixa para um operador.
     */
    openCashier: async (idTenant, idBranch, userId, userName, openingBalance) => {
        const existingSession = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        if (existingSession) {
            throw new Error(`Usuário já possui um caixa aberto (ID: ${existingSession.id})`);
        }

        const safeOpeningBalance = parseFloat(openingBalance) || 0;

        const sessionData = {
            idUser: userId,
            userName,
            openedAt: normalizeDate(new Date()),
            openingBalance: safeOpeningBalance,
            status: 'open',
            totalIncome: 0,
            totalExpenses: 0,
            expectedBalance: safeOpeningBalance,
            openingNotes: 'Caixa aberto via sistema'
        };

        await CashierSessionSchema.validate(sessionData);

        const newSession = await cashierRepository.create(idTenant, idBranch, sessionData);

        await AuditService.log({
            idTenant, idBranch, userId,
            userName,
            action: 'CASHIER_OPEN',
            entityType: 'cashierSession',
            entityId: newSession.id,
            description: `Caixa aberto com saldo inicial de R$ ${openingBalance}`,
            details: { openingBalance }
        });

        return newSession;
    },

    /**
     * Fecha a sessão de caixa e calcula a diferença.
     */
    closeCashier: async (idTenant, idBranch, userId, sessionId, closingData) => {
        const session = await cashierRepository.findById(idTenant, idBranch, sessionId);
        if (!session) throw new Error("Sessão de caixa não encontrada");
        if (session.status !== 'open') throw new Error("Caixa já está fechado");

        // Recalcular saldo esperado (Auditabilidade)
        const transactions = await transactionRepository.findBySession(idTenant, idBranch, sessionId);
        const activeTransactions = transactions.filter(t => !t.deletedAt);

        // Dinheiro Entrou: Income ou Suprimento, method = money
        const moneyIn = activeTransactions
            .filter(t => (t.type === 'income' || t.category === 'supply') && t.method === 'money')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Dinheiro Saiu: Expense ou Sangria, method = money
        const moneyOut = activeTransactions
            .filter(t => (t.type === 'expense' || t.category === 'withdrawal') && t.method === 'money')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const calculatedExpectedBalance = (parseFloat(session.openingBalance) || 0) + moneyIn - moneyOut;

        const updateData = {
            status: 'closed',
            closedAt: normalizeDate(new Date()),
            expectedBalance: calculatedExpectedBalance, // Garante consistência
            actualBalance: parseFloat(closingData.actualBalance) || 0,
            difference: (parseFloat(closingData.actualBalance) || 0) - calculatedExpectedBalance,
            closingNotes: closingData.notes
        };

        await cashierRepository.update(idTenant, idBranch, sessionId, updateData);

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'CASHIER_CLOSE',
            entityType: 'cashierSession',
            entityId: sessionId,
            description: `Caixa fechado. Diferença: R$ ${updateData.difference}`,
            details: updateData
        });

        return { ...session, ...updateData };
    },

    /**
     * Registra uma movimentação (Entrada/Saída) e atualiza o saldo da sessão ativa.
     */
    registerMovement: async (idTenant, idBranch, userId, movementData) => {
        const cashierSession = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        if (!cashierSession) {
            throw new Error("É necessário ter um caixa aberto para registrar movimentações.");
        }

        const fullMovement = {
            ...movementData,
            idCashierSession: cashierSession.id,
            createdBy: userId, // ✅ Necessário para o Dashboard Operacional (Minhas Vendas)
            date: normalizeDate(new Date()),
            status: 'completed'
        };

        await TransactionSchema.validate(fullMovement);

        const newMovement = await transactionRepository.create(idTenant, idBranch, fullMovement);

        let updates = {};
        if (fullMovement.type === 'income' || fullMovement.category === 'supply') { // Entrada ou Suprimento
            updates.totalIncome = (cashierSession.totalIncome || 0) + (parseFloat(fullMovement.netAmount || fullMovement.amount) || 0);

            // Apenas Dinheiro Físico soma na Gaveta
            if (fullMovement.method === 'money') {
                updates.expectedBalance = (cashierSession.expectedBalance || 0) + (parseFloat(fullMovement.amount) || 0);
            }
        } else {
            // Expenses/Withdrawals (Saída ou Sangria)
            updates.totalExpenses = (cashierSession.totalExpenses || 0) + (parseFloat(fullMovement.amount) || 0);

            // Apenas Dinheiro Físico sai da Gaveta
            if (fullMovement.method === 'money') {
                updates.expectedBalance = (cashierSession.expectedBalance || 0) - (parseFloat(fullMovement.amount) || 0);
            }
        }

        await cashierRepository.update(idTenant, idBranch, cashierSession.id, updates);

        // ✅ LANÇAMENTO CONTÁBIL
        // 1. Se for sangria/suprimento com banco vinculado
        if ((fullMovement.category === 'withdrawal' || fullMovement.category === 'supply')
            && fullMovement.idBankAccount) {
            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.createCashierMovement(idTenant, idBranch, {
                    id: newMovement.id,
                    type: fullMovement.category,
                    amount: fullMovement.amount,
                    idBankAccount: fullMovement.idBankAccount,
                    bankAccountName: fullMovement.bankAccountName || 'Banco',
                    description: fullMovement.description,
                    date: normalizeDate(new Date())
                }),
                { sourceType: 'cashier_movement', sourceId: newMovement.id, operation: 'createCashierMovement' }
            );
        }
        // 2. Se for uma movimentação avulsa (não vinculada a Venda ou Conta a Pagar já contabilizada)
        // Isso garante que taxas, pequenas despesas ou receitas manuais apareçam na DRE.
        else if (!fullMovement.idSale && !fullMovement.idPayable) {
            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.createGenericMovementEntry(idTenant, idBranch, {
                    ...fullMovement,
                    id: newMovement.id
                }),
                { sourceType: 'cashier_generic', sourceId: newMovement.id, operation: 'createGenericMovementEntry' }
            );
        }

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: movementData.userName,
            action: fullMovement.type === 'income' ? 'CASHIER_INCOME' : 'CASHIER_EXPENSE',
            entityType: 'financialTransaction',
            entityId: newMovement.id,
            description: `[Caixa] ${fullMovement.type === 'income' ? 'Entrada' : 'Saída'}: R$ ${fullMovement.amount}`,
            details: fullMovement
        });

        return newMovement;
    },

    /**
     * Verifica se existe um caixa aberto para o usuário, lançando erro se não houver.
     * Útil para transações que dependem do caixa.
     */
    ensureOpenSession: async (idTenant, idBranch, userId) => {
        const session = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        if (!session) {
            throw new Error("É necessário abrir o caixa antes de realizar esta operação.");
        }
        return session;
    },

    /**
     * Lista as transações financeiras (Movimentações de Caixa)
     */
    listTransactions: async (idTenant, idBranch, filters = {}, limitCount = 50) => {
        const whereClauses = [];

        if (filters.startDate) whereClauses.push(['date', '>=', normalizeDate(filters.startDate)]);
        if (filters.endDate) whereClauses.push(['date', '<=', normalizeDate(filters.endDate)]);

        const rawData = await transactionRepository.findWhere(idTenant, idBranch,
            whereClauses,
            { field: 'date', direction: 'desc' },
            limitCount
        );

        return rawData.filter(t => !t.deletedAt);
    },

    /**
     * Lista transações por período (Filtro Real no Banco de Dados)
     */
    listByPeriod: async (idTenant, idBranch, startDate, endDate) => {
        // Garantir objetos Date
        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);

        // Firestore exige que o campo de filtro de intervalo seja o primeiro na ordenação (ou requires index)
        const rawData = await transactionRepository.findWhere(idTenant, idBranch,
            [
                ['date', '>=', start],
                ['date', '<=', end]
            ],
            { field: 'date', direction: 'desc' }
        );

        return rawData.filter(t => !t.deletedAt);
    }
}
