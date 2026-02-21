/**
 * Testes para o LedgerService (Sistema Contábil de Partidas Dobradas)
 * 
 * Valida que TODOS os lançamentos mantêm o equilíbrio contábil:
 *   Soma(Débitos) === Soma(Créditos)
 */

// Mock dos repositórios
jest.mock('../../../data/repositories/LedgerRepository', () => ({
    ledgerRepository: {
        create: jest.fn(),
        findByPeriod: jest.fn(() => [])
    }
}))

jest.mock('../../../data/repositories/LedgerErrorRepository', () => ({
    ledgerErrorRepository: {
        create: jest.fn()
    }
}))

jest.mock('../../../utils/date', () => ({
    normalizeDate: jest.fn((d) => {
        if (d instanceof Date) return d.toISOString().split('T')[0]
        if (typeof d === 'string') return d
        return null
    })
}))

import { LedgerService, STANDARD_ACCOUNTS, safeLedgerCall } from '../LedgerService'
import { ledgerRepository } from '../../../data/repositories/LedgerRepository'
import { ledgerErrorRepository } from '../../../data/repositories/LedgerErrorRepository'

/**
 * Helper: configura o mock do create com validação contábil automática.
 * Verifica que Débitos === Créditos (partidas dobradas).
 */
function setupCreateMock() {
    ledgerRepository.create.mockImplementation((idTenant, idBranch, data) => {
        const totalDebit = data.entries.reduce((sum, e) => sum + (e.debit || 0), 0)
        const totalCredit = data.entries.reduce((sum, e) => sum + (e.credit || 0), 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(
                `DESEQUILÍBRIO CONTÁBIL: Débitos (${totalDebit}) ≠ Créditos (${totalCredit}) ` +
                `em ${data.sourceType}/${data.sourceId}`
            )
        }
        return Promise.resolve({ id: 'ledger-mock-id', ...data })
    })
}

describe('LedgerService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        setupCreateMock()
    })

    // ========================================
    // STANDARD_ACCOUNTS
    // ========================================
    describe('STANDARD_ACCOUNTS', () => {
        it('deve ter todas as contas padrão definidas', () => {
            expect(STANDARD_ACCOUNTS.PRODUCT_REVENUE).toBeDefined()
            expect(STANDARD_ACCOUNTS.SERVICE_REVENUE).toBeDefined()
            expect(STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE).toBeDefined()
            expect(STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE).toBeDefined()
            expect(STANDARD_ACCOUNTS.CASH).toBeDefined()
            expect(STANDARD_ACCOUNTS.BANK_ACCOUNTS).toBeDefined()
            expect(STANDARD_ACCOUNTS.CARD_FEES).toBeDefined()
            expect(STANDARD_ACCOUNTS.CARD_FEES_PROVISION).toBeDefined()
        })

        it('não deve ter contas duplicadas', () => {
            const values = Object.values(STANDARD_ACCOUNTS)
            const unique = new Set(values)
            expect(unique.size).toBe(values.length)
        })
    })

    // ========================================
    // createPayableEntry — Reconhecimento de Despesa
    // ========================================
    describe('createPayableEntry', () => {
        it('deve criar lançamento balanceado (D: Despesa, C: Passivo)', async () => {
            const payable = {
                id: 'pay-1',
                amount: 416.50,
                supplier: 'Fornecedor ABC',
                description: 'Material escritório',
                expenseNumber: 'EXP-001',
            }

            const result = await LedgerService.createPayableEntry('t-1', 'b-1', payable)

            expect(result).toBeDefined()
            expect(ledgerRepository.create).toHaveBeenCalledTimes(1)

            const call = ledgerRepository.create.mock.calls[0]
            const data = call[2]

            expect(data.sourceType).toBe('payable')
            expect(data.entries).toHaveLength(2)
            expect(data.entries[0].debit).toBe(416.50)
            expect(data.entries[0].account).toBe(STANDARD_ACCOUNTS.ADMINISTRATIVE_EXPENSES)
            expect(data.entries[1].credit).toBe(416.50)
            expect(data.entries[1].account).toBe(STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE)
        })

        it('deve usar chartOfAccountId personalizado quando fornecido', async () => {
            const payable = {
                id: 'pay-2',
                amount: 100,
                supplier: 'Tel',
                description: 'Internet',
                chartOfAccountId: '2.3.5',
                chartOfAccountName: 'Telecomunicações',
            }

            await LedgerService.createPayableEntry('t-1', 'b-1', payable)
            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries[0].account).toBe('2.3.5')
            expect(data.entries[0].accountName).toBe('Telecomunicações')
        })
    })

    // ========================================
    // payPayableEntry — Pagamento de Despesa
    // ========================================
    describe('payPayableEntry', () => {
        it('deve criar lançamento balanceado (D: Passivo, C: Banco)', async () => {
            const payable = { id: 'pay-1', supplier: 'ABC', description: 'Mat' }
            const payment = {
                amount: 300,
                idBankAccount: 'bank-1',
                bankAccountName: 'Bradesco',
                paymentDate: '2025-03-15',
                paymentMethod: 'transfer',
            }

            const result = await LedgerService.payPayableEntry('t-1', 'b-1', payable, payment)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries[0].debit).toBe(300)
            expect(data.entries[0].account).toBe(STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE)
            expect(data.entries[1].credit).toBe(300)
            expect(data.entries[1].account).toBe('bank-1')
        })
    })

    // ========================================
    // createSaleEntry — Reconhecimento de Receita
    // ========================================
    describe('createSaleEntry', () => {
        it('deve criar lançamento balanceado (D: Recebível, C: Receita)', async () => {
            const sale = {
                id: 'sale-1',
                total: 1500,
                saleNumber: 'VND-001',
                saleDate: '2025-03-10',
            }

            const result = await LedgerService.createSaleEntry('t-1', 'b-1', sale)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries[0].debit).toBe(1500)
            expect(data.entries[0].account).toBe(STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE)
            expect(data.entries[1].credit).toBe(1500)
        })

        it('deve usar conta de receita customizada', async () => {
            const sale = {
                id: 'sale-2',
                total: 200,
                saleNumber: 'VND-002',
                revenueAccountId: STANDARD_ACCOUNTS.PRODUCT_REVENUE,
                revenueAccountName: 'Venda de Produtos',
            }

            await LedgerService.createSaleEntry('t-1', 'b-1', sale)
            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries[1].account).toBe(STANDARD_ACCOUNTS.PRODUCT_REVENUE)
        })
    })

    // ========================================
    // createCardFeeProvisionEntry — Provisão de Taxas
    // ========================================
    describe('createCardFeeProvisionEntry', () => {
        it('deve criar provisão apenas com MDR (sem antecipação)', async () => {
            const provision = {
                idSale: 'sale-1',
                saleNumber: 'VND-001',
                amount: 45,
                financialFeeAmount: 0,
            }

            const result = await LedgerService.createCardFeeProvisionEntry('t-1', 'b-1', provision)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries).toHaveLength(2)
            expect(data.entries[0].debit).toBe(45)
            expect(data.entries[0].account).toBe(STANDARD_ACCOUNTS.CARD_FEES)
            expect(data.entries[1].credit).toBe(45)
            expect(data.entries[1].account).toBe(STANDARD_ACCOUNTS.CARD_FEES_PROVISION)
        })

        it('deve criar provisão com MDR + Antecipação (3 entradas)', async () => {
            const provision = {
                idSale: 'sale-2',
                saleNumber: 'VND-002',
                amount: 30,
                financialFeeAmount: 15,
            }

            const result = await LedgerService.createCardFeeProvisionEntry('t-1', 'b-1', provision)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries).toHaveLength(3)
            expect(data.entries[0].debit).toBe(30)
            expect(data.entries[1].debit).toBe(15)
            expect(data.entries[1].account).toBe(STANDARD_ACCOUNTS.FINANCIAL_EXPENSES_ANTICIPATION)
            expect(data.entries[2].credit).toBe(45)
        })
    })

    // ========================================
    // settleReceivableEntry — Liquidação de Recebível
    // ========================================
    describe('settleReceivableEntry', () => {
        it('deve criar lançamento sem taxa (pagamento líquido = bruto)', async () => {
            const receivable = { id: 'r-1', description: 'Parcela 1', clientName: 'João' }
            const settlement = {
                grossAmount: 500,
                netAmount: 500,
                feeAmount: 0,
                idBankAccount: 'bank-1',
                bankAccountName: 'Bradesco',
                settlementDate: '2025-03-15',
            }

            const result = await LedgerService.settleReceivableEntry('t-1', 'b-1', receivable, settlement)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries).toHaveLength(2)
        })

        it('deve criar lançamento com taxa (3 entradas para regime antigo)', async () => {
            const receivable = {
                id: 'r-2',
                description: 'Parcela Cartão',
                clientName: 'Maria',
                createdAt: '2020-01-01',
            }
            const settlement = {
                grossAmount: 1000,
                netAmount: 950,
                feeAmount: 50,
                idBankAccount: 'bank-1',
                bankAccountName: 'Stone',
                settlementDate: '2025-03-20',
            }

            const result = await LedgerService.settleReceivableEntry('t-1', 'b-1', receivable, settlement)
            expect(result).toBeDefined()

            const data = ledgerRepository.create.mock.calls[0][2]
            expect(data.entries).toHaveLength(3)
            expect(data.entries[0].debit).toBe(950)
            expect(data.entries[1].credit).toBe(1000)
            expect(data.entries[2].debit).toBe(50)
            expect(data.entries[2].account).toBe(STANDARD_ACCOUNTS.CARD_FEES)
        })
    })

    // ========================================
    // createCashierMovement — Sangria / Suprimento
    // ========================================
    describe('createCashierMovement', () => {
        it('deve criar sangria (D: Banco, C: Caixa)', async () => {
            const movement = {
                id: 'mov-1',
                type: 'withdrawal',
                amount: 500,
                description: 'Retirada para banco',
                idBankAccount: 'bank-1',
                bankAccountName: 'Bradesco',
                date: '2025-03-15',
            }

            await LedgerService.createCashierMovement('t-1', 'b-1', movement)
            const data = ledgerRepository.create.mock.calls[0][2]

            expect(data.entries[0].account).toBe('bank-1')
            expect(data.entries[0].debit).toBe(500)
            expect(data.entries[1].account).toBe(STANDARD_ACCOUNTS.CASH)
            expect(data.entries[1].credit).toBe(500)
        })

        it('deve criar suprimento (D: Caixa, C: Banco)', async () => {
            const movement = {
                id: 'mov-2',
                type: 'supply',
                amount: 300,
                description: 'Troco',
                idBankAccount: 'bank-1',
                bankAccountName: 'Bradesco',
                date: '2025-03-15',
            }

            await LedgerService.createCashierMovement('t-1', 'b-1', movement)
            const data = ledgerRepository.create.mock.calls[0][2]

            expect(data.entries[0].account).toBe(STANDARD_ACCOUNTS.CASH)
            expect(data.entries[0].debit).toBe(300)
            expect(data.entries[1].account).toBe('bank-1')
            expect(data.entries[1].credit).toBe(300)
        })
    })

    // ========================================
    // createBankTransfer
    // ========================================
    describe('createBankTransfer', () => {
        it('deve criar transferência balanceada (D: Destino, C: Origem)', async () => {
            const transfer = {
                id: 'tf-1',
                amount: 1000,
                idBankAccountFrom: 'bank-a',
                fromBankName: 'Bradesco',
                idBankAccountTo: 'bank-b',
                toBankName: 'Itaú',
                date: '2025-03-15',
            }

            await LedgerService.createBankTransfer('t-1', 'b-1', transfer)
            const data = ledgerRepository.create.mock.calls[0][2]

            expect(data.entries[0].debit).toBe(1000)
            expect(data.entries[0].account).toBe('bank-b')
            expect(data.entries[1].credit).toBe(1000)
            expect(data.entries[1].account).toBe('bank-a')
        })
    })

    // ========================================
    // getTrialBalance — Balancete
    // ========================================
    describe('getTrialBalance', () => {
        it('deve calcular saldos por conta', async () => {
            ledgerRepository.findByPeriod.mockResolvedValue([
                {
                    entries: [
                        { account: '3.1.1', accountName: 'Banco', debit: 1000, credit: 0 },
                        { account: '1.1.2', accountName: 'Receita', debit: 0, credit: 1000 },
                    ]
                },
                {
                    entries: [
                        { account: '2.1', accountName: 'Despesa', debit: 200, credit: 0 },
                        { account: '3.1.1', accountName: 'Banco', debit: 0, credit: 200 },
                    ]
                }
            ])

            const balances = await LedgerService.getTrialBalance('t-1', 'b-1', '2025-01-01', '2025-12-31')

            expect(balances).toHaveLength(3)

            const bank = balances.find(b => b.account === '3.1.1')
            expect(bank.debit).toBe(1000)
            expect(bank.credit).toBe(200)
            expect(bank.balance).toBe(800)

            const revenue = balances.find(b => b.account === '1.1.2')
            expect(revenue.balance).toBe(1000)

            const expense = balances.find(b => b.account === '2.1')
            expect(expense.balance).toBe(200)
        })

        it('deve retornar array vazio sem lançamentos', async () => {
            ledgerRepository.findByPeriod.mockResolvedValue([])
            const balances = await LedgerService.getTrialBalance('t-1', 'b-1', '2025-01-01', '2025-12-31')
            expect(balances).toEqual([])
        })
    })
})

// ========================================
// safeLedgerCall — Wrapper Seguro
// ========================================
describe('safeLedgerCall', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('deve retornar success quando a função contábil é bem-sucedida', async () => {
        const result = await safeLedgerCall('t-1', 'b-1',
            async () => ({ id: 'ok' }),
            { operation: 'test' }
        )
        expect(result.success).toBe(true)
    })

    it('deve retornar error sem bloquear quando a função contábil falha', async () => {
        const result = await safeLedgerCall('t-1', 'b-1',
            async () => { throw new Error('Firestore indisponível') },
            { operation: 'testFail', sourceType: 'test', sourceId: 'x-1' }
        )
        expect(result.success).toBe(false)
        expect(result.error).toContain('Firestore indisponível')
    })

    it('deve persistir o erro no LedgerErrorRepository', async () => {
        await safeLedgerCall('t-1', 'b-1',
            async () => { throw new Error('Timeout') },
            { operation: 'createPayableEntry', sourceType: 'payable', sourceId: 'p-1' }
        )

        expect(ledgerErrorRepository.create).toHaveBeenCalledWith('t-1', 'b-1', expect.objectContaining({
            operation: 'createPayableEntry',
            sourceType: 'payable',
            sourceId: 'p-1',
            errorMessage: 'Timeout',
        }))
    })
})
