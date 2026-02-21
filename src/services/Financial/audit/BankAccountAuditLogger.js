import { AuditService } from '../../Core/AuditService'

export const BankAccountAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, accountName, initialBalance }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'BANK_ACCOUNT_CREATED',
            entityType: 'bankAccount',
            entityId,
            description: `Nova conta bancária criada: ${accountName} com saldo inicial de R$ ${initialBalance.toFixed(2)}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'bankAccount',
            entityId,
            oldData,
            newData,
            description: `Conta bancária atualizada: ${oldData?.name || entityId}`
        })
    },

    logDeactivation: async ({ idTenant, idBranch, userId, entityId }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'BANK_ACCOUNT_DEACTIVATED',
            entityType: 'bankAccount',
            entityId,
            description: `Conta bancária desativada.`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, accountName, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'BANK_ACCOUNT_DELETED',
            entityType: 'bankAccount',
            entityId,
            description: `Conta bancária excluída (soft delete): ${accountName}`,
            details: { snapshot }
        })
    }
}
