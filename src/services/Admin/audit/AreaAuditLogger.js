import { AuditService } from '../../Core/AuditService'

export const AreaAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, areaName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'AREA_CREATED',
            entityType: 'area',
            entityId,
            description: `Nova área criada: ${areaName}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData, areaName }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'area',
            entityId,
            oldData,
            newData,
            description: `Área atualizada: ${areaName}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, entityId, areaName, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'AREA_DELETED',
            entityType: 'area',
            entityId,
            description: `Área excluída: ${areaName}`,
            details: { snapshot }
        })
    }
}
