import { cashierRepository } from '../../data/repositories/CashierRepository'
import { transactionRepository } from '../../data/repositories/TransactionRepository'
import { CashierAuditLogger } from './audit/CashierAuditLogger'
import { CashierRules } from './domain/CashierRules'
import { CashierSessionSchema, TransactionSchema } from '../../data/schemas/FinancialSchemas'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
import { normalizeDate, isSameDay } from '../../utils/date'

/**
 * Serviço responsável por gerenciar a "Gaveta de Caixa" (Sessões e Movimentações).
 */
export const CashierService = {
    /**
     * Abre uma nova sessão de caixa para um operador.
     */
    openCashier: async (idTenant, idBranch, userId, userName, openingBalance) => {
        const existingSession = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        CashierRules.validateForOpen(existingSession);

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

        await CashierAuditLogger.logOpen({
            idTenant, idBranch, userId, userName,
            entityId: newSession.id,
            openingBalance
        });

        return newSession;
    },

    /**
     * Fecha a sessão de caixa e calcula a diferença.
     */
    closeCashier: async (idTenant, idBranch, userId, sessionId, closingData) => {
        const session = await cashierRepository.findById(idTenant, idBranch, sessionId);
        CashierRules.validateForClose(session);

        const transactions = await transactionRepository.findBySession(idTenant, idBranch, sessionId);
        const calculatedExpectedBalance = CashierRules.calculateExpectedBalance(session.openingBalance, transactions);

        const updateData = {
            status: 'closed',
            closedAt: normalizeDate(new Date()),
            expectedBalance: calculatedExpectedBalance,
            actualBalance: parseFloat(closingData.actualBalance) || 0,
            difference: (parseFloat(closingData.actualBalance) || 0) - calculatedExpectedBalance,
            closingNotes: closingData.notes
        };

        await cashierRepository.update(idTenant, idBranch, sessionId, updateData);

        await CashierAuditLogger.logClose({
            idTenant, idBranch, userId,
            entityId: sessionId,
            updateData
        });

        return { ...session, ...updateData };
    },

    /**
     * Registra uma movimentação (Entrada/Saída) e atualiza o saldo da sessão ativa.
     */
    registerMovement: async (idTenant, idBranch, userId, movementData) => {
        const cashierSession = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        const isHistorical = movementData.date && !isSameDay(normalizeDate(movementData.date), new Date());

        if (!cashierSession && !isHistorical) {
            throw new Error("É necessário ter um caixa aberto para registrar movimentações atuais.");
        }

        const fullMovement = {
            ...movementData,
            idCashierSession: cashierSession?.id || null,
            createdBy: userId,
            date: normalizeDate(movementData.date || new Date()),
            status: 'completed'
        };

        await TransactionSchema.validate(fullMovement);

        const newMovement = await transactionRepository.create(idTenant, idBranch, fullMovement);

        if (cashierSession) {
            const updates = CashierRules.calculateSessionUpdates(cashierSession, fullMovement);
            await cashierRepository.update(idTenant, idBranch, cashierSession.id, updates);
        }

        // Lançamento Contábil
        if (!fullMovement.skipLedger) {
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
            else if (!fullMovement.idSale && !fullMovement.idPayable && !fullMovement.idReceivable) {
                await safeLedgerCall(idTenant, idBranch,
                    () => LedgerService.createGenericMovementEntry(idTenant, idBranch, {
                        ...fullMovement,
                        id: newMovement.id
                    }),
                    { sourceType: 'cashier_generic', sourceId: newMovement.id, operation: 'createGenericMovementEntry' }
                );
            }
        }

        await CashierAuditLogger.logMovement({
            idTenant, idBranch, userId,
            userName: movementData.userName,
            entityId: newMovement.id,
            type: fullMovement.type,
            amount: fullMovement.amount,
            movement: fullMovement
        });

        return newMovement;
    },

    /**
     * Verifica o status do caixa sem lançar exceção.
     */
    checkStatus: async (idTenant, idBranch, userId) => {
        try {
            const session = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
            return { isOpen: !!session, session };
        } catch (error) {
            console.error("Erro ao verificar status do caixa:", error);
            return { isOpen: false, session: null };
        }
    },

    /**
     * Verifica se existe um caixa aberto para o usuário.
     */
    ensureOpenSession: async (idTenant, idBranch, userId) => {
        const session = await cashierRepository.findOpenSession(idTenant, idBranch, userId);
        if (!session) {
            throw new Error("É necessário abrir o caixa antes de realizar esta operação.");
        }
        return session;
    },

    /**
     * Lista as transações financeiras
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
     * Lista transações por período
     */
    listByPeriod: async (idTenant, idBranch, startDate, endDate) => {
        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);

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
