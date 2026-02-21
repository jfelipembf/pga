import { SalesRules } from '../SalesRules'

describe('SalesRules', () => {

    // ========================================
    // classifyRevenue
    // ========================================
    describe('classifyRevenue', () => {
        it('deve classificar como produto quando só há itens de produto', () => {
            const items = [
                { type: 'product', name: 'Touca' },
                { type: 'produto', name: 'Óculos' },
            ]
            const result = SalesRules.classifyRevenue(items)
            expect(result.id).toBe('PRODUCT_REVENUE')
            expect(result.type).toBe('product')
        })

        it('deve classificar como assinatura quando há contrato', () => {
            const items = [
                { type: 'contract', name: 'Plano Mensal' },
                { type: 'product', name: 'Touca' },
            ]
            const result = SalesRules.classifyRevenue(items)
            expect(result.id).toBe('SUBSCRIPTION_REVENUE')
            expect(result.type).toBe('subscription')
        })

        it('deve classificar como serviço quando há serviço mas não contrato', () => {
            const items = [
                { type: 'service', name: 'Aula Avulsa' },
            ]
            const result = SalesRules.classifyRevenue(items)
            expect(result.id).toBe('SERVICE_REVENUE')
            expect(result.type).toBe('service')
        })

        it('deve classificar como serviço quando a lista está vazia', () => {
            const result = SalesRules.classifyRevenue([])
            expect(result.id).toBe('SERVICE_REVENUE')
        })

        it('deve classificar como serviço sem argumentos', () => {
            const result = SalesRules.classifyRevenue()
            expect(result.id).toBe('SERVICE_REVENUE')
        })

        it('deve tratar variantes pt-br (contrato, produto, servico)', () => {
            expect(SalesRules.classifyRevenue([{ type: 'contrato' }]).id).toBe('SUBSCRIPTION_REVENUE')
            expect(SalesRules.classifyRevenue([{ type: 'produto' }]).id).toBe('PRODUCT_REVENUE')
            expect(SalesRules.classifyRevenue([{ type: 'servico' }]).id).toBe('SERVICE_REVENUE')
        })

        it('contrato tem prioridade sobre produto', () => {
            const items = [
                { type: 'product' },
                { type: 'contract' },
            ]
            const result = SalesRules.classifyRevenue(items)
            expect(result.id).toBe('SUBSCRIPTION_REVENUE')
        })
    })

    // ========================================
    // calculateSaleStatus
    // ========================================
    describe('calculateSaleStatus', () => {
        it('deve retornar "unknown" quando a venda é nula', () => {
            expect(SalesRules.calculateSaleStatus(null, [])).toBe('unknown')
        })

        it('deve retornar "cancelled" quando a venda está cancelada', () => {
            const sale = { id: 'sale-1', status: 'cancelled' }
            expect(SalesRules.calculateSaleStatus(sale, [])).toBe('cancelled')
        })

        it('deve retornar "paid" quando não há recebíveis de cliente', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'acquirer', status: 'open', pending: 100 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve retornar "partial" quando há recebíveis de cliente pendentes', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'client', status: 'open', pending: 500 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('partial')
        })

        it('deve retornar "paid" quando recebíveis de cliente estão todos pagos', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'client', status: 'paid', pending: 0 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve ignorar recebíveis deletados', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'client', status: 'open', pending: 500, deletedAt: '2024-01-01' },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve ignorar recebíveis cancelados', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'client', status: 'cancelled', pending: 500 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve ignorar recebíveis de outras vendas', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-OTHER', type: 'client', status: 'open', pending: 500 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve considerar "paid" quando pending <= 0.01 (float precision)', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', type: 'client', status: 'open', pending: 0.005 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('paid')
        })

        it('deve reconhecer paymentMethod "pending_payment" como recebível de cliente', () => {
            const sale = { id: 'sale-1', status: 'completed' }
            const receivables = [
                { idSale: 'sale-1', paymentMethod: 'pending_payment', status: 'open', pending: 300 },
            ]
            expect(SalesRules.calculateSaleStatus(sale, receivables)).toBe('partial')
        })
    })
})
