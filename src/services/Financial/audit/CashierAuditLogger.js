import { AuditService } from '../../Core/AuditService'

export const CashierAuditLogger = {
    logOpen: async ({ idTenant, idBranch, userId, userName, entityId, openingBalance }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'CASHIER_OPEN',
            entityType: 'cashierSession',
            entityId,
            description: `Caixa aberto com saldo inicial de R$ ${openingBalance}`,
            details: { openingBalance }
        })
    },

    logClose: async ({ idTenant, idBranch, userId, entityId, updateData }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'CASHIER_CLOSE',
            entityType: 'cashierSession',
            entityId,
            description: `Caixa fechado. Diferença: R$ ${updateData.difference}`,
            details: updateData
        })
    },

    logMovement: async ({ idTenant, idBranch, userId, userName, entityId, type, amount, movement }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: type === 'income' ? 'CASHIER_INCOME' : 'CASHIER_EXPENSE',
            entityType: 'financialTransaction',
            entityId,
            description: `[Caixa] ${type === 'income' ? 'Entrada' : 'Saída'}: R$ ${amount}`,
            details: movement
        })
    }
}
