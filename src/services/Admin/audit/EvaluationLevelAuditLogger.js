import { AuditService } from '../../Core/AuditService'

export const EvaluationLevelAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, title, value }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'EVALUATION_LEVEL_CREATED',
            entityType: 'evaluationLevel',
            entityId,
            description: `Novo nível de avaliação criado: ${title} (valor: ${value})`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'evaluationLevel',
            entityId,
            oldData,
            newData,
            description: `Nível de avaliação atualizado: ${newData.title || entityId}`
        })
    },

    logReorder: async ({ idTenant, idBranch, userId, userName }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'EVALUATION_LEVELS_REORDERED',
            entityType: 'evaluationLevel',
            entityId: 'bulk',
            description: `Ordem dos níveis de avaliação atualizada`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, entityId, title, snapshot }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'EVALUATION_LEVEL_DELETED',
            entityType: 'evaluationLevel',
            entityId,
            description: `Nível de avaliação excluído: ${title || entityId}`,
            details: { snapshot }
        })
    }
}
