import { AuditService } from '../../Core/AuditService'

export const RoleAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, roleName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ROLE_CREATED',
            entityType: 'role',
            entityId,
            description: `Nova função criada: ${roleName || 'Sem nome'}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'role',
            entityId,
            oldData,
            newData,
            description: `Atualizou a função ${oldData?.name || entityId}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, entityId, roleName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ROLE_DELETED',
            entityType: 'role',
            entityId,
            description: `Função excluída: ${roleName || entityId}`
        })
    }
}
