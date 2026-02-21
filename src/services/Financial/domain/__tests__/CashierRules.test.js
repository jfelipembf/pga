import { CashierRules } from '../CashierRules'

describe('CashierRules', () => {

    // ========================================
    // validateForOpen
    // ========================================
    describe('validateForOpen', () => {
        it('deve permitir abrir caixa quando não existe sessão', () => {
            expect(() => CashierRules.validateForOpen(null)).not.toThrow()
            expect(() => CashierRules.validateForOpen(undefined)).not.toThrow()
        })

        it('deve impedir abrir caixa quando já existe uma sessão aberta', () => {
            const existingSession = { id: 'session-123', status: 'open' }
            expect(() => CashierRules.validateForOpen(existingSession))
                .toThrow(/já possui um caixa aberto/)
        })
    })

    // ========================================
    // validateForClose
    // ========================================
    describe('validateForClose', () => {
        it('deve permitir fechar caixa com sessão aberta', () => {
            const session = { id: 'session-1', status: 'open' }
            expect(() => CashierRules.validateForClose(session)).not.toThrow()
        })

        it('deve impedir fechar caixa sem sessão', () => {
            expect(() => CashierRules.validateForClose(null))
                .toThrow(/não encontrada/)
        })

        it('deve impedir fechar caixa já fechado', () => {
            const session = { id: 'session-1', status: 'closed' }
            expect(() => CashierRules.validateForClose(session))
                .toThrow(/já está fechado/)
        })
    })

    // ========================================
    // calculateExpectedBalance
    // ========================================
    describe('calculateExpectedBalance', () => {
        it('deve retornar o saldo de abertura quando não há transações', () => {
            const result = CashierRules.calculateExpectedBalance(100, [])
            expect(result).toBe(100)
        })

        it('deve somar entradas em dinheiro (income + money)', () => {
            const transactions = [
                { method: 'money', type: 'income', category: 'sale', amount: 50 },
                { method: 'money', type: 'income', category: 'sale', amount: 30 },
            ]
            const result = CashierRules.calculateExpectedBalance(100, transactions)
            expect(result).toBe(180)
        })

        it('deve subtrair sangrias (withdrawal + money)', () => {
            const transactions = [
                { method: 'money', type: 'income', category: 'sale', amount: 200 },
                { method: 'money', category: 'withdrawal', amount: 50 },
            ]
            const result = CashierRules.calculateExpectedBalance(100, transactions)
            expect(result).toBe(250) // 100 + 200 - 50
        })

        it('deve ignorar transações com deletedAt', () => {
            const transactions = [
                { method: 'money', type: 'income', category: 'sale', amount: 100 },
                { method: 'money', type: 'income', category: 'sale', amount: 50, deletedAt: '2024-01-01' },
            ]
            const result = CashierRules.calculateExpectedBalance(100, transactions)
            expect(result).toBe(200) // 100 + 100, ignora os 50 deletados
        })

        it('deve ignorar transações que não são em dinheiro', () => {
            const transactions = [
                { method: 'credit_card', type: 'income', category: 'sale', amount: 500 },
                { method: 'pix', type: 'income', category: 'sale', amount: 300 },
                { method: 'money', type: 'income', category: 'sale', amount: 50 },
            ]
            const result = CashierRules.calculateExpectedBalance(100, transactions)
            expect(result).toBe(150) // apenas 100 + 50 (money)
        })

        it('deve somar suprimentos (supply + money)', () => {
            const transactions = [
                { method: 'money', category: 'supply', amount: 200 },
            ]
            const result = CashierRules.calculateExpectedBalance(100, transactions)
            expect(result).toBe(300)
        })

        it('deve lidar com valores como strings', () => {
            const result = CashierRules.calculateExpectedBalance('100', [
                { method: 'money', type: 'income', category: 'sale', amount: '50.5' },
            ])
            expect(result).toBe(150.5)
        })

        it('deve lidar com saldo de abertura zero', () => {
            const result = CashierRules.calculateExpectedBalance(0, [
                { method: 'money', type: 'income', category: 'sale', amount: 75 },
                { method: 'money', type: 'expense', category: 'other', amount: 25 },
            ])
            expect(result).toBe(50)
        })
    })

    // ========================================
    // calculateSessionUpdates
    // ========================================
    describe('calculateSessionUpdates', () => {
        const baseSession = { totalIncome: 1000, totalExpenses: 200, expectedBalance: 500 }

        it('deve incrementar totalIncome para receitas', () => {
            const movement = { type: 'income', method: 'credit_card', amount: 200, netAmount: 190 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.totalIncome).toBe(1190) // 1000 + 190 (netAmount)
        })

        it('deve incrementar expectedBalance apenas para receita em dinheiro', () => {
            const movement = { type: 'income', method: 'money', amount: 100 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.expectedBalance).toBe(600) // 500 + 100
        })

        it('NÃO deve alterar expectedBalance para receitas em cartão', () => {
            const movement = { type: 'income', method: 'credit_card', amount: 200, netAmount: 190 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.expectedBalance).toBeUndefined()
        })

        it('deve incrementar totalExpenses para despesas', () => {
            const movement = { type: 'expense', method: 'money', amount: 50 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.totalExpenses).toBe(250) // 200 + 50
        })

        it('deve decrementar expectedBalance para despesas em dinheiro', () => {
            const movement = { type: 'expense', method: 'money', amount: 50 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.expectedBalance).toBe(450) // 500 - 50
        })

        it('deve tratar suprimento como income (incrementa saldo)', () => {
            const movement = { type: 'neither', category: 'supply', method: 'money', amount: 300 }
            const updates = CashierRules.calculateSessionUpdates(baseSession, movement)
            expect(updates.totalIncome).toBe(1300)
            expect(updates.expectedBalance).toBe(800)
        })
    })
})
