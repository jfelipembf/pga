import { AuditService } from '../../Core/AuditService'

export const TrainingPlanAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, description }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TRAINING_PLAN_CREATED',
            entityType: 'training_plan',
            entityId,
            description: `Criado plano de treino: ${description || 'Sem descrição'}`
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'training_plan',
            entityId,
            oldData,
            newData,
            description: `Atualizado plano de treino: ${newData.description || oldData?.description}`
        })
    },

    logDeletion: async ({ idTenant, idBranch, userId, userName, entityId, description }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TRAINING_PLAN_DELETED',
            entityType: 'training_plan',
            entityId,
            description: `Removido plano de treino: ${description || 'Sem descrição'}`
        })
    },

    logShare: async ({ idTenant, idBranch, userId, userName, entityId, workoutDescription, clientCount }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TRAINING_PLAN_SHARED',
            entityType: 'training_plan',
            entityId,
            description: `Compartilhado treino "${workoutDescription}" com ${clientCount} alunos`
        })
    }
}
