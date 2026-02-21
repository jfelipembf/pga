import { AuditService } from '../../Core/AuditService'

export const StaffAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, staffName, email, roleName, roleId }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'STAFF_CREATED',
            entityType: 'staff',
            entityId,
            description: `Novo colaborador criado: ${staffName} (${roleName || 'Sem cargo'})`,
            details: { email, role: roleName, roleId }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'staff',
            entityId,
            oldData,
            newData,
            description: `Atualizou o colaborador ${oldData?.name || entityId}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, staffName, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'STAFF_DELETED',
            entityType: 'staff',
            entityId,
            description: `Colaborador excluído: ${staffName || entityId}`,
            details: { snapshot }
        })
    }
}
