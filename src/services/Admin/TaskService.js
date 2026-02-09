import { taskRepository } from "../../data/repositories/Admin/TaskRepository"
import { AuditService } from "../Core/AuditService"
import { StorageService } from "../Core/StorageService"
import moment from "moment"

/**
 * Serviço de Gestão de Tarefas (Tasks).
 * Orquestra persistência, auditoria e anexos.
 */
export const TaskService = {

    /**
     * Cria uma nova tarefa.
     */
    create: async (idTenant, idBranch, taskData, currentUser) => {
        try {
            const data = {
                ...taskData,
                status: 'pending',
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                createdBy: currentUser.uid,
                createdByName: currentUser.firstName || currentUser.fullName || currentUser.email,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const taskId = await taskRepository.create(idTenant, idBranch, data);

            // Audit
            await AuditService.log({
                idTenant,
                idBranch,
                userId: currentUser.uid,
                userName: data.createdByName,
                action: 'TASK_CREATED',
                entityType: 'task',
                entityId: taskId,
                description: `Criou a tarefa: ${data.title}`,
                details: { task: data }
            });

            return taskId;
        } catch (error) {
            console.error("Erro no TaskService.create:", error);
            throw error;
        }
    },

    /**
     * Atualiza uma tarefa existente.
     */
    update: async (idTenant, idBranch, taskId, updates, currentUser) => {
        try {
            const oldTask = await taskRepository.findById(idTenant, idBranch, taskId);

            const dataToUpdate = {
                ...updates,
                updatedAt: new Date()
            };

            if (updates.dueDate) {
                dataToUpdate.dueDate = new Date(updates.dueDate);
            }

            await taskRepository.update(idTenant, idBranch, taskId, dataToUpdate);

            // Audit
            await AuditService.logUpdate({
                idTenant,
                idBranch,
                userId: currentUser.uid,
                userName: currentUser.firstName || currentUser.fullName,
                entityType: 'task',
                entityId: taskId,
                oldData: oldTask,
                newData: dataToUpdate,
                description: `Atualizou a tarefa: ${oldTask.title}`
            });

            return true;
        } catch (error) {
            console.error("Erro no TaskService.update:", error);
            throw error;
        }
    },

    /**
     * Marca tarefa como concluída.
     */
    complete: async (idTenant, idBranch, taskId, currentUser) => {
        return TaskService.update(idTenant, idBranch, taskId, {
            status: 'completed',
            completedAt: new Date(),
            completedBy: currentUser.uid,
            completedByName: currentUser.firstName || currentUser.fullName
        }, currentUser);
    },

    /**
     * Lista tarefas para hoje ou por filtro.
     */
    listTasks: async (idTenant, idBranch, filters = {}) => {
        try {
            // Buscamos todas e filtramos em memória para suportar a lógica de recorrência 
            // sem precisar de índices complexos para cada combinação.
            const allTasks = await taskRepository.findAll(idTenant, idBranch);

            const today = moment().startOf('day');

            return allTasks.filter(task => {
                const taskDate = moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate);

                // Filtro por Staff (atribuído para)
                if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;

                // Filtro por Status
                if (filters.status && task.status !== filters.status) return false;

                // Lógica de Recorrência e Exibição Diária
                if (task.isRecurring) {
                    // Se a tarefa é recorrente, ela aparece se o padrão bater hoje
                    // (Ex simples: diário sempre aparece se estiver pendente)
                    if (task.recurrence?.frequency === 'daily') return true;

                    if (task.recurrence?.frequency === 'weekly') {
                        const dayOfWeek = today.day(); // 0-6
                        return task.recurrence?.daysOfWeek?.includes(dayOfWeek);
                    }
                }

                // Se não for recorrente, comparamos a data
                return taskDate.isSame(today, 'day') || (task.status === 'pending' && taskDate.isBefore(today));
            }).sort((a, b) => {
                // Ordenar por prioridade (high > medium > low)
                const priorities = { high: 3, medium: 2, low: 1 };
                return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
            });
        } catch (error) {
            console.error("Erro no TaskService.listTasks:", error);
            return [];
        }
    },

    /**
     * Upload de anexo para tarefa.
     */
    uploadAttachment: async (idTenant, idBranch, taskId, file) => {
        try {
            const url = await StorageService.uploadDocument(file, {
                idTenant,
                idBranch,
                entityType: 'tasks',
                entityId: taskId
            });

            const attachment = {
                name: file.name,
                url,
                type: file.type,
                createdAt: new Date()
            };

            // Adiciona ao array de anexos da tarefa
            const task = await taskRepository.findById(idTenant, idBranch, taskId);
            const attachments = [...(task.attachments || []), attachment];

            await taskRepository.update(idTenant, idBranch, taskId, { attachments });

            return attachment;
        } catch (error) {
            console.error("Erro no TaskService.uploadAttachment:", error);
            throw error;
        }
    }
}
