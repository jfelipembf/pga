import { taskRepository } from "../../data/repositories/Admin/TaskRepository"
import { AuditService } from "../Core/AuditService"
import { StorageService } from "../Core/StorageService"
import moment from "moment"
import { parseDateInput } from "../../utils/date"

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
                dueDate: parseDateInput(taskData.dueDate), // parseDateInput evita bug de fuso com strings YYYY-MM-DD
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
                dataToUpdate.dueDate = parseDateInput(updates.dueDate);
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
     * Lista tarefas para hoje ou por filtro com enriquecimento de dados.
     */
    listTasks: async (idTenant, idBranch, filters = {}) => {
        try {
            const allTasks = await taskRepository.findAll(idTenant, idBranch);

            // ✅ Carregamento paralelo de dependências para enriquecimento
            const { StaffService } = await import('./StaffService');
            const { ClientService } = await import('../Clients/ClientService');

            const [staffList, clientList] = await Promise.all([
                StaffService.listAll(idTenant, idBranch),
                ClientService.listClients(idTenant, idBranch)
            ]);

            const staffMap = staffList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
            const clientMap = clientList.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

            const today = moment().startOf('day');

            return allTasks.filter(task => {
                const taskDate = moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate);

                // Enriquecimento de Staff (Múltiplos)
                const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                task.assignedStaffDetails = assignees.map(id => {
                    const s = staffMap[id];
                    return s ? { id: s.id, name: s.name, photo: s.photo, role: s.roleName } : null;
                }).filter(Boolean);

                // Enriquecimento de Alunos (Múltiplos)
                const clients = Array.isArray(task.relatedclients) ? task.relatedclients : [];
                task.relatedclientsDetails = clients.map(id => {
                    const c = clientMap[id];
                    return c ? { id: c.id, name: c.name, photo: c.photoUrl } : null;
                }).filter(Boolean);

                // Filtro por Staff (atribuído para) - Verifica se o ID está no array
                if (filters.assignedTo) {
                    const taskAssignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                    if (!taskAssignees.includes(filters.assignedTo)) return false;
                }

                // Filtro por Status
                if (filters.status && task.status !== filters.status) return false;

                // Lógica de Recorrência
                if (task.isRecurring) {
                    if (task.recurrence?.frequency === 'daily') return true;
                    if (task.recurrence?.frequency === 'weekly') {
                        return task.recurrence?.daysOfWeek?.includes(today.day());
                    }
                    if (task.recurrence?.frequency === 'monthly') {
                        return task.recurrence?.dayOfMonth === today.date();
                    }
                }

                return taskDate.isSame(today, 'day') || (task.status === 'pending' && taskDate.isBefore(today));
            }).sort((a, b) => {
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
