import { AuditService } from '../../Core/AuditService'

export const PayableAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, expenseNumber, description }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'PAYABLE_CREATED',
            entityType: 'payable',
            entityId,
            description: `Nova conta a pagar registrada: ${expenseNumber} - ${description}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'payable',
            entityId,
            oldData,
            newData,
            description: `Atualizou a conta a pagar ${oldData?.description || entityId}`
        })
    },

    logPayment: async ({ idTenant, idBranch, userId, userName, entityId, expenseNumber, amount, method }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'PAYABLE_PAID',
            entityType: 'payable',
            entityId,
            description: `Conta paga: ${expenseNumber || entityId}. Valor: R$ ${amount.toFixed(2)} via ${method}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, expenseNumber, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYABLE_DELETED',
            entityType: 'payable',
            entityId,
            description: `Conta a pagar excluída (soft delete): ${expenseNumber || entityId}`,
            details: { snapshot }
        })
    }
}
