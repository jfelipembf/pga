import { AuditService } from '../../Core/AuditService'

export const EventAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, eventName, eventType, startDate, endDate }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'EVENT_CREATED',
            entityType: 'event',
            entityId,
            description: `Novo ciclo de ${eventType} criado: ${eventName}`,
            details: { name: eventName, type: eventType, startDate, endDate }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'event',
            entityId,
            oldData,
            newData,
            description: `Ciclo ${oldData?.name || entityId} atualizado`
        })
    },

    logFinish: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'event',
            entityId,
            oldData,
            newData,
            description: `Ciclo finalizado manualmente`
        })
    }
}
