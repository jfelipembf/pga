import { CatalogRules } from '../CatalogRules'

describe('CatalogRules', () => {

    // ========================================
    // calculateNewStock
    // ========================================
    describe('calculateNewStock', () => {
        it('deve adicionar estoque', () => {
            expect(CatalogRules.calculateNewStock(10, 5, 'add')).toBe(15)
        })

        it('deve subtrair estoque', () => {
            expect(CatalogRules.calculateNewStock(10, 3, 'subtract')).toBe(7)
        })

        it('deve definir estoque absoluto com operação desconhecida', () => {
            expect(CatalogRules.calculateNewStock(10, 5, 'set')).toBe(5)
        })

        it('deve tratar estoque atual null como 0', () => {
            expect(CatalogRules.calculateNewStock(null, 5, 'add')).toBe(5)
        })

        it('deve impedir estoque negativo', () => {
            expect(() => CatalogRules.calculateNewStock(3, 5, 'subtract'))
                .toThrow(/negativo/)
        })

        it('deve permitir estoque zero exato', () => {
            expect(CatalogRules.calculateNewStock(5, 5, 'subtract')).toBe(0)
        })
    })

    // ========================================
    // validateForDeletion
    // ========================================
    describe('validateForDeletion', () => {
        it('deve permitir deletar item existente', () => {
            expect(() => CatalogRules.validateForDeletion({ id: 'c-1' })).not.toThrow()
        })

        it('deve impedir deletar item nulo', () => {
            expect(() => CatalogRules.validateForDeletion(null))
                .toThrow(/não encontrado/)
        })
    })

    // ========================================
    // buildCreationPayload
    // ========================================
    describe('buildCreationPayload', () => {
        it('deve definir defaults corretos', () => {
            const payload = CatalogRules.buildCreationPayload(
                { name: 'Touca', price: 25 },
                'user-123'
            )
            expect(payload.name).toBe('Touca')
            expect(payload.isActive).toBe(true)
            expect(payload.status).toBe('active')
            expect(payload.stock).toBe(0)
            expect(payload.minStock).toBe(0)
            expect(payload.createdBy).toBe('user-123')
            expect(payload.deletedAt).toBeNull()
        })

        it('deve respeitar isActive=false', () => {
            const payload = CatalogRules.buildCreationPayload(
                { name: 'Item Inativo', isActive: false },
                'user-123'
            )
            expect(payload.isActive).toBe(false)
        })

        it('deve preservar estoque quando informado', () => {
            const payload = CatalogRules.buildCreationPayload(
                { name: 'Óculos', stock: 50, minStock: 10 },
                'user-123'
            )
            expect(payload.stock).toBe(50)
            expect(payload.minStock).toBe(10)
        })
    })
})
