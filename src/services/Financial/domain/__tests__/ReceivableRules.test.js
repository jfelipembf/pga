import { ReceivableRules } from '../ReceivableRules'

describe('ReceivableRules', () => {

    // ========================================
    // validateForSettlement
    // ========================================
    describe('validateForSettlement', () => {
        it('deve permitir liquidar um recebível aberto', () => {
            const receivable = { id: 'r-1', status: 'open', amount: 100 }
            expect(() => ReceivableRules.validateForSettlement(receivable)).not.toThrow()
        })

        it('deve impedir liquidar recebível nulo', () => {
            expect(() => ReceivableRules.validateForSettlement(null))
                .toThrow(/não encontrado/)
        })

        it('deve impedir liquidar recebível já pago', () => {
            const receivable = { id: 'r-1', status: 'paid' }
            expect(() => ReceivableRules.validateForSettlement(receivable))
                .toThrow(/já está liquidado/)
        })

        it('deve impedir liquidar recebível excluído', () => {
            const receivable = { id: 'r-1', status: 'open', deletedAt: '2024-01-01' }
            expect(() => ReceivableRules.validateForSettlement(receivable))
                .toThrow(/excluído/)
        })
    })

    // ========================================
    // validateForCancellation
    // ========================================
    describe('validateForCancellation', () => {
        it('deve permitir cancelar recebível aberto', () => {
            const receivable = { id: 'r-1', status: 'open' }
            expect(() => ReceivableRules.validateForCancellation(receivable)).not.toThrow()
        })

        it('deve impedir cancelar recebível já pago', () => {
            const receivable = { id: 'r-1', status: 'paid' }
            expect(() => ReceivableRules.validateForCancellation(receivable))
                .toThrow(/já recebido/)
        })

        it('deve impedir cancelar recebível nulo', () => {
            expect(() => ReceivableRules.validateForCancellation(null))
                .toThrow(/não encontrado/)
        })
    })

    // ========================================
    // validateForDeletion
    // ========================================
    describe('validateForDeletion', () => {
        it('deve permitir deletar recebível aberto', () => {
            const receivable = { id: 'r-1', status: 'open' }
            expect(() => ReceivableRules.validateForDeletion(receivable)).not.toThrow()
        })

        it('deve impedir deletar recebível já pago (SEGURANÇA)', () => {
            const receivable = { id: 'r-1', status: 'paid' }
            expect(() => ReceivableRules.validateForDeletion(receivable))
                .toThrow(/SEGURANÇA/)
        })
    })

    // ========================================
    // calculateSettlement
    // ========================================
    describe('calculateSettlement', () => {
        const baseReceivable = {
            id: 'r-1',
            amount: 1000,
            pending: 1000,
            feePercent: 0,
            feeAmount: 0,
        }

        it('deve calcular liquidação total simples (sem taxa)', () => {
            const result = ReceivableRules.calculateSettlement(
                baseReceivable,
                { amount: 1000 }
            )
            expect(result.settlementAmount).toBe(1000)
            expect(result.feeAmount).toBe(0)
            expect(result.netAmount).toBe(1000)
            expect(result.remaining).toBe(0)
            expect(result.isFullyPaid).toBe(true)
        })

        it('deve calcular liquidação parcial', () => {
            const result = ReceivableRules.calculateSettlement(
                baseReceivable,
                { amount: 400 }
            )
            expect(result.settlementAmount).toBe(400)
            expect(result.remaining).toBe(600)
            expect(result.isFullyPaid).toBe(false)
        })

        it('deve calcular taxa quando estimatedFee é informada', () => {
            const result = ReceivableRules.calculateSettlement(
                baseReceivable,
                { amount: 1000, estimatedFee: 3.5 }
            )
            expect(result.settlementAmount).toBe(1000)
            expect(result.feePercent).toBe(3.5)
            expect(result.feeAmount).toBe(35) // 1000 * 3.5%
            expect(result.netAmount).toBe(965) // 1000 - 35
            expect(result.isFullyPaid).toBe(true)
        })

        it('deve usar feePercent do recebível quando estimatedFee não é informada', () => {
            const receivable = { ...baseReceivable, feePercent: 2 }
            const result = ReceivableRules.calculateSettlement(
                receivable,
                { amount: 500 }
            )
            expect(result.feePercent).toBe(2)
            expect(result.feeAmount).toBe(10) // 500 * 2%
            expect(result.netAmount).toBe(490)
        })

        it('deve usar pending como valor default quando amount não informado', () => {
            const receivable = { ...baseReceivable, pending: 750 }
            const result = ReceivableRules.calculateSettlement(
                receivable,
                {}
            )
            expect(result.settlementAmount).toBe(750)
        })

        it('deve considerar isFullyPaid para valores residuais menores que 1 centavo', () => {
            const receivable = { ...baseReceivable, pending: 100 }
            const result = ReceivableRules.calculateSettlement(
                receivable,
                { amount: 99.995 }
            )
            expect(result.isFullyPaid).toBe(true)
        })

        it('deve lidar com valores negativos de remaining (sobre-pagamento)', () => {
            const result = ReceivableRules.calculateSettlement(
                { ...baseReceivable, pending: 100 },
                { amount: 150 }
            )
            expect(result.remaining).toBe(0) // Math.max(0, ...)
        })
    })
})
