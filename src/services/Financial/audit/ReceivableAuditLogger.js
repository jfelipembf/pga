import { AuditService } from '../../Core/AuditService'

export const ReceivableAuditLogger = {
    logSettlement: async ({ idTenant, idBranch, userId, userName, entityId, amount, clientName, updatedData, method }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'RECEIVABLE_SETTLED',
            entityType: 'receivable',
            entityId,
            description: `Recebimento de R$ ${amount.toFixed(2)} do cliente ${clientName}`,
            details: { ...updatedData, method }
        })
    },

    logCancellation: async ({ idTenant, idBranch, userId, entityId, reason }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_CANCELLED',
            entityType: 'receivable',
            entityId,
            description: `Título a receber cancelado. Motivo: ${reason}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, entityId, description, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_DELETED',
            entityType: 'receivable',
            entityId,
            description: `Título a receber excluído (soft delete): ${description || entityId}`,
            details: { snapshot }
        })
    },

    logAnticipation: async ({ idTenant, idBranch, userId, userName, receivableIds, anticipationFee, totalNet, totalGross, totalExtraFee }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'RECEIVABLE_ANTICIPATED',
            entityType: 'receivable_bulk',
            entityId: receivableIds.join(','),
            description: `Antecipação realizada: ${receivableIds.length} títulos. Taxa: ${anticipationFee}%`,
            details: { totalNet, totalGross, totalExtraFee }
        })
    }
}
