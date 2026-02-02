import { cashierRepository } from '../../data/repositories/CashierRepository'
import { transactionRepository } from '../../data/repositories/TransactionRepository'
import { AuditService } from '../Audit/AuditService'
import { CashierSessionSchema, TransactionSchema } from '../../data/schemas/FinancialSchemas'
import { LedgerService } from '../Ledger/LedgerService'
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

        const updateData = {
            status: 'closed',
            closedAt: normalizeDate(new Date()),
            actualBalance: parseFloat(closingData.actualBalance) || 0,
            difference: (parseFloat(closingData.actualBalance) || 0) - session.expectedBalance,
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
            date: normalizeDate(new Date()),
            status: 'completed'
        };

        await TransactionSchema.validate(fullMovement);

        const newMovement = await transactionRepository.create(idTenant, idBranch, fullMovement);

        let updates = {};
        if (fullMovement.type === 'income') {
            updates.totalIncome = (cashierSession.totalIncome || 0) + (parseFloat(fullMovement.netAmount) || 0);

            // Apenas Dinheiro Físico soma na Gaveta
            if (fullMovement.method === 'money' || fullMovement.method === 'dinheiro') {
                updates.expectedBalance = (cashierSession.expectedBalance || 0) + (parseFloat(fullMovement.netAmount) || 0);
            }
        } else {
            updates.totalExpenses = (cashierSession.totalExpenses || 0) + (parseFloat(fullMovement.amount) || 0);

            // Sangrias sempre saem da Gaveta (pois são feitas em dinheiro físico geralmente)
            // Se houver despesa paga via PIX direto do caixa, precisaria validar. Mas sangria assume-se retirada física.
            updates.expectedBalance = (cashierSession.expectedBalance || 0) - (parseFloat(fullMovement.amount) || 0);
        }

        await cashierRepository.update(idTenant, idBranch, cashierSession.id, updates);

        // ✅ LANÇAMENTO CONTÁBIL (se for sangria/suprimento com banco vinculado)
        if ((fullMovement.category === 'withdrawal' || fullMovement.category === 'supply')
            && fullMovement.idBankAccount) {
            try {
                await LedgerService.createCashierMovement(idTenant, idBranch, {
                    id: newMovement.id,
                    type: fullMovement.category,
                    amount: fullMovement.amount,
                    idBankAccount: fullMovement.idBankAccount,
                    bankAccountName: fullMovement.bankAccountName || 'Banco',
                    description: fullMovement.description,
                    date: normalizeDate(new Date())
                })
            } catch (ledgerError) {
                console.error("Erro ao criar lançamento contábil de movimentação de caixa:", ledgerError)
            }
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
     * Lista as transações financeiras (Movimentações de Caixa)
     */
    listTransactions: async (idTenant, idBranch, filters = {}, limitCount = 50) => {
        const whereClauses = [];

        if (filters.startDate) whereClauses.push(['date', '>=', normalizeDate(filters.startDate)]);
        if (filters.endDate) whereClauses.push(['date', '<=', normalizeDate(filters.endDate)]);

        return await transactionRepository.findWhere(idTenant, idBranch,
            whereClauses,
            { field: 'date', direction: 'desc' },
            limitCount
        );
    },

    /**
     * Lista transações por período (Filtro Real no Banco de Dados)
     */
    listByPeriod: async (idTenant, idBranch, startDate, endDate) => {
        // Garantir objetos Date
        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);

        // Firestore exige que o campo de filtro de intervalo seja o primeiro na ordenação (ou requires index)
        return await transactionRepository.findWhere(idTenant, idBranch,
            [
                ['date', '>=', start],
                ['date', '<=', end]
            ],
            { field: 'date', direction: 'desc' }
        );
    }
}
