import { AuditService } from '../../Core/AuditService'

export const ContractAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, title, contractData }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            userName: userName || 'Sistema',
            action: 'CONTRACT_CREATED',
            entityType: 'contract',
            entityId,
            entityName: title,
            changes: { created: contractData }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData, title }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId,
            userName: userName || 'Sistema',
            entityType: 'contract',
            entityId,
            oldData,
            newData,
            description: `Contrato atualizado: ${title || entityId}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, title, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            userName: 'Sistema',
            action: 'CONTRACT_DELETED',
            entityType: 'contract',
            entityId,
            entityName: title,
            description: `Contrato excluído: ${title}`,
            details: { snapshot }
        })
    }
}
