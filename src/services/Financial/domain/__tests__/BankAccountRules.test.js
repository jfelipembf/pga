import { BankAccountRules } from '../BankAccountRules'

// Mock dinâmico do repositório
jest.mock('../../../../data/repositories/TransactionRepository', () => ({
    transactionRepository: {
        findWhere: jest.fn()
    }
}))

describe('BankAccountRules', () => {

    // ========================================
    // validateNotPrimary
    // ========================================
    describe('validateNotPrimary', () => {
        it('deve permitir excluir conta não primária', () => {
            expect(() => BankAccountRules.validateNotPrimary({ isPrimary: false }))
                .not.toThrow()
        })

        it('deve impedir excluir conta primária', () => {
            expect(() => BankAccountRules.validateNotPrimary({ isPrimary: true }))
                .toThrow(/conta principal/)
        })

        it('deve permitir quando isPrimary é undefined', () => {
            expect(() => BankAccountRules.validateNotPrimary({}))
                .not.toThrow()
        })

        it('deve tratar conta nula graciosamente', () => {
            expect(() => BankAccountRules.validateNotPrimary(null))
                .not.toThrow()
        })
    })

    // ========================================
    // validateForDeletion
    // ========================================
    describe('validateForDeletion', () => {
        const { transactionRepository } = require('../../../../data/repositories/TransactionRepository')

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('deve permitir deletar conta sem transações', async () => {
            transactionRepository.findWhere.mockResolvedValue([])

            await expect(
                BankAccountRules.validateForDeletion('t-1', 'b-1', 'account-1')
            ).resolves.not.toThrow()
        })

        it('deve impedir deletar conta com transações ativas', async () => {
            transactionRepository.findWhere.mockResolvedValue([{ id: 'tx-1' }])

            await expect(
                BankAccountRules.validateForDeletion('t-1', 'b-1', 'account-1')
            ).rejects.toThrow(/SEGURANÇA/)
        })

        it('deve passar a query correta para o repositório', async () => {
            transactionRepository.findWhere.mockResolvedValue([])

            await BankAccountRules.validateForDeletion('tenant-x', 'branch-y', 'acct-z')

            expect(transactionRepository.findWhere).toHaveBeenCalledWith(
                'tenant-x', 'branch-y',
                expect.arrayContaining([
                    ['idBankAccount', '==', 'acct-z'],
                    ['deletedAt', '==', null]
                ]),
                null, 1
            )
        })
    })
})
