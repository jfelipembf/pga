import { AuditService } from '../../Core/AuditService'

export const TaskAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, title, taskData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TASK_CREATED',
            entityType: 'task',
            entityId,
            description: `Criou a tarefa: ${title}`,
            details: { task: taskData }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'task',
            entityId,
            oldData,
            newData,
            description: `Atualizou a tarefa: ${oldData.title}`
        })
    }
}
