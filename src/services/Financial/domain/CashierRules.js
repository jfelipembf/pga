/**
 * Regras de Negócio para Caixa (Cashier)
 */
export const CashierRules = {
    /**
     * Valida se pode abrir caixa
     */
    validateForOpen: (existingSession) => {
        if (existingSession) {
            throw new Error(`Usuário já possui um caixa aberto (ID: ${existingSession.id})`)
        }
    },

    /**
     * Valida se pode fechar caixa
     */
    validateForClose: (session) => {
        if (!session) throw new Error("Sessão de caixa não encontrada")
        if (session.status !== 'open') throw new Error("Caixa já está fechado")
    },

    /**
     * Calcula o saldo esperado ao fechar o caixa
     */
    calculateExpectedBalance: (openingBalance, transactions) => {
        const activeTransactions = transactions.filter(t => !t.deletedAt)

        const moneyIn = activeTransactions
            .filter(t => t.method === 'money' && (
                t.category === 'supply' ||
                (t.type === 'income' && t.category !== 'withdrawal')
            ))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

        const moneyOut = activeTransactions
            .filter(t => t.method === 'money' && (
                t.category === 'withdrawal' ||
                (t.type === 'expense' && t.category !== 'supply')
            ))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

        return (parseFloat(openingBalance) || 0) + moneyIn - moneyOut
    },

    /**
     * Calcula updates da sessão ao registrar movimentação
     */
    calculateSessionUpdates: (session, movement) => {
        const updates = {}

        if (movement.type === 'income' || movement.category === 'supply') {
            updates.totalIncome = (session.totalIncome || 0) + (parseFloat(movement.netAmount || movement.amount) || 0)

            if (movement.method === 'money') {
                updates.expectedBalance = (session.expectedBalance || 0) + (parseFloat(movement.amount) || 0)
            }
        } else {
            updates.totalExpenses = (session.totalExpenses || 0) + (parseFloat(movement.amount) || 0)

            if (movement.method === 'money') {
                updates.expectedBalance = (session.expectedBalance || 0) - (parseFloat(movement.amount) || 0)
            }
        }

        return updates
    }
}
