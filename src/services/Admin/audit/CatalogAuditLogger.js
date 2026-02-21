import { AuditService } from '../../Core/AuditService'

export const CatalogAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, itemName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'CATALOG_ITEM_CREATED',
            entityType: 'catalog',
            entityId,
            description: `Novo item criado: ${itemName}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'catalog',
            entityId,
            oldData,
            newData,
            description: `Item atualizado: ${newData.name || entityId}`
        })
    },

    logStockUpdate: async ({ idTenant, idBranch, userId, entityId, itemName, operation, quantity, newStock }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'CATALOG_STOCK_UPDATED',
            entityType: 'catalog',
            entityId,
            description: `Estoque atualizado: ${itemName} - ${operation} ${quantity} (novo: ${newStock})`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, itemName, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'CATALOG_ITEM_DELETED',
            entityType: 'catalog',
            entityId,
            description: `Item excluído: ${itemName || entityId}`,
            details: { snapshot }
        })
    }
}
