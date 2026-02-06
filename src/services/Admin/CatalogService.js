import { catalogRepository } from '../../data/repositories/CatalogRepository'
import { AuditService } from '../Core/AuditService'
import { CatalogSchema } from '../../data/schemas/Admin/CatalogSchema'

/**
 * Serviço para Gestão de Catálogo de Produtos/Serviços (Catalog)
 */
export const CatalogService = {
    /**
     * Cria um novo item no catálogo
     */
    createCatalogItem: async (idTenant, idBranch, userId, catalogData) => {
        await CatalogSchema.validate(catalogData, { abortEarly: false })

        const newItem = await catalogRepository.create(idTenant, idBranch, {
            ...catalogData,
            isActive: catalogData.isActive !== false,
            status: catalogData.status || 'active',
            stock: catalogData.stock || 0,
            minStock: catalogData.minStock || 0,
            createdBy: userId,
            createdAt: new Date(),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: catalogData.userName,
            action: 'CATALOG_ITEM_CREATED',
            entityType: 'catalog',
            entityId: newItem.id,
            description: `Novo item criado: ${catalogData.name}`
        })

        return newItem
    },

    /**
     * Lista todos os itens do catálogo
     */
    listAll: async (idTenant, idBranch) => {
        const data = await catalogRepository.findAll(idTenant, idBranch)
        return data.filter(c => !c.deletedAt)
    },

    /**
     * Lista itens com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}) => {
        const whereClauses = []

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(['status', '==', filters.status])
        }

        if (filters.isActive !== undefined) {
            whereClauses.push(['isActive', '==', filters.isActive])
        }

        if (filters.type && filters.type !== 'all') {
            whereClauses.push(['type', '==', filters.type])
        }

        if (filters.category && filters.category !== 'all') {
            whereClauses.push(['category', '==', filters.category])
        }

        const rawData = await catalogRepository.findWhere(
            idTenant,
            idBranch,
            whereClauses,
            { field: 'name', direction: 'asc' }
        )

        return rawData.filter(c => !c.deletedAt)
    },

    /**
     * Busca item por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await catalogRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza um item do catálogo
     */
    updateCatalogItem: async (idTenant, idBranch, userId, id, data) => {
        // 1. Snapshot
        const oldData = await catalogRepository.findById(idTenant, idBranch, id)

        const result = await catalogRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        })

        await AuditService.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityType: 'catalog',
            entityId: id,
            oldData,
            newData: data,
            description: `Item atualizado: ${data.name || id}`
        })

        return result
    },

    /**
     * Atualiza estoque de um item
     */
    updateStock: async (idTenant, idBranch, userId, id, quantity, operation = 'set') => {
        const item = await catalogRepository.findById(idTenant, idBranch, id)
        if (!item) throw new Error("Item não encontrado")

        let newStock = item.stock || 0

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

        const result = await catalogRepository.update(idTenant, idBranch, id, {
            stock: newStock,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'CATALOG_STOCK_UPDATED',
            entityType: 'catalog',
            entityId: id,
            description: `Estoque atualizado: ${item.name} - ${operation} ${quantity} (novo: ${newStock})`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteCatalogItem: async (idTenant, idBranch, userId, id) => {
        const item = await catalogRepository.findById(idTenant, idBranch, id)
        if (!item) throw new Error("Item não encontrado")

        const result = await catalogRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'CATALOG_ITEM_DELETED',
            entityType: 'catalog',
            entityId: id,
            description: `Item excluído: ${item.name || id}`,
            details: { snapshot: item }
        })

        return result
    }
}
