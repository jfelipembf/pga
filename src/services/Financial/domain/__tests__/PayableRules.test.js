import { PayableRules } from '../PayableRules'

describe('PayableRules', () => {

    // ========================================
    // validateForPayment
    // ========================================
    describe('validateForPayment', () => {
        it('deve permitir pagar conta pendente', () => {
            const payable = { id: 'p-1', status: 'pending', amount: 500 }
            expect(() => PayableRules.validateForPayment(payable)).not.toThrow()
        })

        it('deve impedir pagar conta nula', () => {
            expect(() => PayableRules.validateForPayment(null))
                .toThrow(/não encontrada/)
        })

        it('deve impedir pagar conta já paga', () => {
            const payable = { id: 'p-1', status: 'paid' }
            expect(() => PayableRules.validateForPayment(payable))
                .toThrow(/já está paga/)
        })
    })

    // ========================================
    // validateForDeletion
    // ========================================
    describe('validateForDeletion', () => {
        it('deve permitir deletar conta pendente', () => {
            const payable = { id: 'p-1', status: 'pending' }
            expect(() => PayableRules.validateForDeletion(payable)).not.toThrow()
        })

        it('deve impedir deletar conta já paga (SEGURANÇA)', () => {
            const payable = { id: 'p-1', status: 'paid' }
            expect(() => PayableRules.validateForDeletion(payable))
                .toThrow(/SEGURANÇA/)
        })

        it('deve impedir deletar conta nula', () => {
            expect(() => PayableRules.validateForDeletion(null))
                .toThrow(/não encontrada/)
        })
    })

    // ========================================
    // validateBankBalance
    // ========================================
    describe('validateBankBalance', () => {
        it('deve permitir pagamento quando há saldo suficiente', () => {
            const bankAccount = { currentBalance: 1000 }
            expect(() => PayableRules.validateBankBalance(bankAccount, 500)).not.toThrow()
        })

        it('deve permitir pagamento quando saldo é exatamente igual', () => {
            const bankAccount = { currentBalance: 500 }
            expect(() => PayableRules.validateBankBalance(bankAccount, 500)).not.toThrow()
        })

        it('deve impedir pagamento quando saldo é insuficiente', () => {
            const bankAccount = { currentBalance: 100 }
            expect(() => PayableRules.validateBankBalance(bankAccount, 500))
                .toThrow(/Saldo insuficiente/)
        })

        it('deve exibir valores formatados na mensagem de erro', () => {
            const bankAccount = { currentBalance: 99.99 }
            expect(() => PayableRules.validateBankBalance(bankAccount, 150.50))
                .toThrow('Saldo insuficiente. Disponível: R$ 99.99, Necessário: R$ 150.50')
        })

        it('deve impedir pagamento sem conta bancária', () => {
            expect(() => PayableRules.validateBankBalance(null, 100))
                .toThrow(/não encontrada/)
        })

        it('deve tratar currentBalance como 0 quando não definido', () => {
            const bankAccount = { name: 'Conta Teste' } // sem currentBalance
            expect(() => PayableRules.validateBankBalance(bankAccount, 1))
                .toThrow(/Saldo insuficiente/)
        })
    })
})
