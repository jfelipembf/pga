import { AuditService } from '../../Core/AuditService'

export const ClientAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, userPhoto, client }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'CREATE',
            entityType: 'client',
            entityId: client.id,
            description: `Cliente criado: ${client.name}`,
            details: { name: client.name, email: client.email }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, userPhoto, idClient, clientData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'UPDATE',
            entityType: 'client',
            entityId: idClient,
            description: `Perfil atualizado: ${clientData.name}`,
            details: { updateFieldsCount: Object.keys(clientData).length }
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, userPhoto, client }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'DELETE',
            entityType: 'client',
            entityId: client.id,
            description: `Cliente excluído: ${client.name}`,
            details: {
                snapshot: client,
                method: 'soft_delete'
            }
        })
    },

    logLifecycleStatusUpdate: async ({ idTenant, idBranch, userId, userName, userPhoto, idClient, from, to, reason, metadata }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'UPDATE_LIFECYCLE_STATUS',
            entityType: 'client',
            entityId: idClient,
            details: {
                from,
                to,
                reason,
                ...metadata
            }
        })
    }
}
