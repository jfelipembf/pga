import { AuditService } from '../../Core/AuditService'

export const AcquirerAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, acquirerName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ACQUIRER_CREATED',
            entityType: 'acquirer',
            entityId,
            description: `Nova credenciadora configurada: ${acquirerName}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'acquirer',
            entityId,
            oldData,
            newData,
            description: `Configuração da credenciadora atualizada: ${newData.name || entityId}`
        })
    },

    logDeactivation: async ({ idTenant, idBranch, userId, entityId }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'ACQUIRER_DEACTIVATED',
            entityType: 'acquirer',
            entityId,
            description: `Credenciadora desativada.`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'ACQUIRER_DELETED',
            entityType: 'acquirer',
            entityId,
            description: `Credenciadora excluída (soft delete).`,
            details: { snapshot }
        })
    }
}
