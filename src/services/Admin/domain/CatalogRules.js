/**
 * Regras de Negócio para Catálogo
 */
export const CatalogRules = {
    /**
     * Valida e calcula novo estoque
     */
    calculateNewStock: (currentStock, quantity, operation) => {
        let newStock = currentStock || 0

        if (operation === 'add') {
            newStock += quantity
        } else if (operation === 'subtract') {
            newStock -= quantity
        } else {
            newStock = quantity
        }

        if (newStock < 0) {
            throw new Error("Estoque não pode ser negativo")
        }

        return newStock
    },

    /**
     * Valida se um item pode ser deletado
     */
    validateForDeletion: (item) => {
        if (!item) throw new Error("Item não encontrado")
    },

    /**
     * Prepara os dados de criação de um item
     */
    buildCreationPayload: (catalogData, userId) => {
        return {
            ...catalogData,
            isActive: catalogData.isActive !== false,
            status: catalogData.status || 'active',
            stock: catalogData.stock || 0,
            minStock: catalogData.minStock || 0,
            createdBy: userId,
            deletedAt: null
        }
    }
}
