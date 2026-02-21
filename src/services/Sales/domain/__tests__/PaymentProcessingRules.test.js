import { PaymentProcessingRules } from '../PaymentProcessingRules'

describe('PaymentProcessingRules', () => {

    // ========================================
    // resolveAcquirer
    // ========================================
    describe('resolveAcquirer', () => {
        const acquirers = [
            { id: 'acq-1', name: 'Stone' },
            { id: 'acq-2', name: 'PagSeguro' },
        ]

        it('deve encontrar adquirente por id', () => {
            const payment = { idAcquirer: 'acq-1' }
            const result = PaymentProcessingRules.resolveAcquirer(acquirers, payment)
            expect(result?.name).toBe('Stone')
        })

        it('deve encontrar adquirente por provider (id)', () => {
            const payment = { provider: 'acq-2' }
            const result = PaymentProcessingRules.resolveAcquirer(acquirers, payment)
            expect(result?.name).toBe('PagSeguro')
        })

        it('deve encontrar adquirente por provider (name)', () => {
            const payment = { provider: 'Stone' }
            const result = PaymentProcessingRules.resolveAcquirer(acquirers, payment)
            expect(result?.id).toBe('acq-1')
        })

        it('deve retornar undefined quando não encontra', () => {
            const payment = { provider: 'Inexistente' }
            expect(PaymentProcessingRules.resolveAcquirer(acquirers, payment)).toBeUndefined()
        })

        it('deve lidar com lista vazia de adquirentes', () => {
            const payment = { idAcquirer: 'acq-1' }
            expect(PaymentProcessingRules.resolveAcquirer([], payment)).toBeUndefined()
        })
    })

    // ========================================
    // resolveFeePercentage
    // ========================================
    describe('resolveFeePercentage', () => {
        const acquirer = {
            fees: {
                debitCard: 1.5,
                creditCard1x: 3.0,
                creditCard2x: 3.5,
                creditCard3x: 4.0,
            },
            rateConfigs: [
                {
                    brands: ['mastercard'],
                    fees: { debitCard: 1.8, creditCard1x: 3.2 }
                }
            ]
        }

        it('deve retornar taxa de débito', () => {
            const payment = { methodId: 'debit_card' }
            expect(PaymentProcessingRules.resolveFeePercentage(acquirer, payment, 1)).toBe(1.5)
        })

        it('deve retornar taxa de crédito à vista (1x)', () => {
            const payment = { methodId: 'credit_card' }
            expect(PaymentProcessingRules.resolveFeePercentage(acquirer, payment, 1)).toBe(3.0)
        })

        it('deve retornar taxa de crédito parcelado (3x)', () => {
            const payment = { methodId: 'credit_card' }
            expect(PaymentProcessingRules.resolveFeePercentage(acquirer, payment, 3)).toBe(4.0)
        })

        it('deve usar configuração de bandeira quando disponível', () => {
            const payment = { methodId: 'credit_card', brand: 'mastercard' }
            expect(PaymentProcessingRules.resolveFeePercentage(acquirer, payment, 1)).toBe(3.2)
        })

        it('deve usar configuração de bandeira para débito', () => {
            const payment = { methodId: 'debit_card', brand: 'mastercard' }
            expect(PaymentProcessingRules.resolveFeePercentage(acquirer, payment, 1)).toBe(1.8)
        })

        it('deve retornar 0 sem adquirente', () => {
            expect(PaymentProcessingRules.resolveFeePercentage(null, {}, 1)).toBe(0)
        })

        it('deve retornar 0 sem fees', () => {
            expect(PaymentProcessingRules.resolveFeePercentage({}, {}, 1)).toBe(0)
        })
    })

    // ========================================
    // resolveBaseFeePercentage
    // ========================================
    describe('resolveBaseFeePercentage', () => {
        const acquirer = {
            standardFees: {
                debitCard: 1.0,
                creditCard1x: 2.0,
                creditCard2x: 2.5,
                creditCard7x: 3.0,
            }
        }

        it('deve retornar a taxa padrão para débito', () => {
            const result = PaymentProcessingRules.resolveBaseFeePercentage(
                acquirer, { methodId: 'debit_card' }, 1, 1.5
            )
            expect(result).toBe(1.0)
        })

        it('deve retornar a taxa padrão para crédito 1x', () => {
            const result = PaymentProcessingRules.resolveBaseFeePercentage(
                acquirer, { methodId: 'credit_card' }, 1, 3.0
            )
            expect(result).toBe(2.0)
        })

        it('deve fazer fallback para bucket 2-6x', () => {
            const result = PaymentProcessingRules.resolveBaseFeePercentage(
                acquirer, { methodId: 'credit_card' }, 5, 4.5
            )
            expect(result).toBe(2.5) // Cai no bucket 2x quando 5x não existe
        })

        it('deve fazer fallback para bucket 7-12x', () => {
            const result = PaymentProcessingRules.resolveBaseFeePercentage(
                acquirer, { methodId: 'credit_card' }, 10, 5.0
            )
            expect(result).toBe(3.0) // Cai no bucket 7x quando 10x não existe
        })

        it('deve retornar totalFee quando não tem standardFees', () => {
            const result = PaymentProcessingRules.resolveBaseFeePercentage(
                {}, { methodId: 'credit_card' }, 1, 3.5
            )
            expect(result).toBe(3.5)
        })
    })

    // ========================================
    // calculateDueDate
    // ========================================
    describe('calculateDueDate', () => {
        // Agora PaymentProcessingRules usa parseDateInput internamente
        // garantindo consistência com fuso local.
        const { parseDateInput } = require('../../../../utils/date')

        it('deve adicionar 1 dia para débito', () => {
            const base = parseDateInput('2025-03-10', 'noon')
            const result = PaymentProcessingRules.calculateDueDate(
                '2025-03-10', 1, 'debit_card', { settlementDays: 30 }
            )
            const diffMs = result.getTime() - base.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(1)
        })

        it('deve adicionar 1 dia para antecipação (settlementDays=1)', () => {
            const base = parseDateInput('2025-03-10', 'noon')
            const result = PaymentProcessingRules.calculateDueDate(
                '2025-03-10', 3, 'credit_card', { settlementDays: 1 }
            )
            const diffDays = Math.round((result.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(1)
        })

        it('deve adicionar 30 dias para 1ª parcela com settlement 30 dias', () => {
            const base = parseDateInput('2025-03-01', 'noon')
            const result = PaymentProcessingRules.calculateDueDate(
                '2025-03-01', 1, 'credit_card', { settlementDays: 30 }
            )
            const diffDays = Math.round((result.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(30)
        })

        it('deve adicionar 60 dias para 2ª parcela com settlement 30 dias', () => {
            const base = parseDateInput('2025-03-01', 'noon')
            const result = PaymentProcessingRules.calculateDueDate(
                '2025-03-01', 2, 'credit_card', { settlementDays: 30 }
            )
            const diffDays = Math.round((result.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(60)
        })

        it('deve usar 30 dias default quando acquirer não tem settlementDays', () => {
            const base = parseDateInput('2025-03-01', 'noon')
            const result = PaymentProcessingRules.calculateDueDate(
                '2025-03-01', 1, 'credit_card', {}
            )
            const diffDays = Math.round((result.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(30)
        })
    })
})
