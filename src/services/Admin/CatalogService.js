import { catalogRepository } from '../../data/repositories/CatalogRepository'
import { CatalogAuditLogger } from './audit/CatalogAuditLogger'
import { CatalogRules } from './domain/CatalogRules'
import { CatalogSchema } from '../../data/schemas/Admin/CatalogSchema'
import { normalizeDate } from "../../utils/date"

/**
 * Serviço para Gestão de Catálogo de Produtos/Serviços (Catalog)
 */
export const CatalogService = {
    /**
     * Cria um novo item no catálogo
     */
    createCatalogItem: async (idTenant, idBranch, userId, catalogData) => {
        await CatalogSchema.validate(catalogData, { abortEarly: false })

        const payload = CatalogRules.buildCreationPayload(catalogData, userId)

        const newItem = await catalogRepository.create(idTenant, idBranch, {
            ...payload,
            createdAt: normalizeDate(new Date()),
        })

        await CatalogAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: catalogData.userName,
            entityId: newItem.id,
            itemName: catalogData.name
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
        const oldData = await catalogRepository.findById(idTenant, idBranch, id)

        const result = await catalogRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        await CatalogAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: data
        })

        return result
    },

    /**
     * Atualiza estoque de um item
     */
    updateStock: async (idTenant, idBranch, userId, id, quantity, operation = 'set') => {
        const item = await catalogRepository.findById(idTenant, idBranch, id)
        CatalogRules.validateForDeletion(item) // reutiliza validação de existência

        const newStock = CatalogRules.calculateNewStock(item.stock, quantity, operation)

        const result = await catalogRepository.update(idTenant, idBranch, id, {
            stock: newStock,
            updatedAt: normalizeDate(new Date())
        })

        await CatalogAuditLogger.logStockUpdate({
            idTenant, idBranch, userId,
            entityId: id,
            itemName: item.name,
            operation,
            quantity,
            newStock
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteCatalogItem: async (idTenant, idBranch, userId, id) => {
        const item = await catalogRepository.findById(idTenant, idBranch, id)
        CatalogRules.validateForDeletion(item)

        const result = await catalogRepository.softDelete(idTenant, idBranch, id, userId)

        await CatalogAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: id,
            itemName: item.name,
            snapshot: item
        })

        return result
    }
}
