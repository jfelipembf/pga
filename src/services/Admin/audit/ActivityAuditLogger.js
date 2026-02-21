import { AuditService } from '../../Core/AuditService'

export const ActivityAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, activityName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ACTIVITY_CREATED',
            entityType: 'activity',
            entityId,
            description: `Nova atividade criada: ${activityName}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'activity',
            entityId,
            oldData,
            newData,
            description: `Atualizou a atividade ${oldData?.name || entityId}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, entityId, activityName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ACTIVITY_DELETED',
            entityType: 'activity',
            entityId,
            description: `Atividade excluída: ${activityName || entityId}`
        })
    }
}
