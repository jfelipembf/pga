import { taskRepository } from "../../data/repositories/Admin/TaskRepository"
import { TaskAuditLogger } from "./audit/TaskAuditLogger"
import { TaskRules } from "./domain/TaskRules"
import { StorageService } from "../Core/StorageService"
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
        const data = {
            ...taskData,
            status: 'pending',
            dueDate: parseDateInput(taskData.dueDate),
            createdBy: currentUser.uid,
            createdByName: currentUser.firstName || currentUser.fullName || currentUser.email,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const taskId = await taskRepository.create(idTenant, idBranch, data)

        await TaskAuditLogger.logCreation({
            idTenant, idBranch,
            userId: currentUser.uid,
            userName: data.createdByName,
            entityId: taskId,
            title: data.title,
            taskData: data
        })

        return taskId
    },

    /**
     * Atualiza uma tarefa existente.
     */
    update: async (idTenant, idBranch, taskId, updates, currentUser) => {
        const oldTask = await taskRepository.findById(idTenant, idBranch, taskId)

        const dataToUpdate = {
            ...updates,
            updatedAt: new Date()
        }

        if (updates.dueDate) {
            dataToUpdate.dueDate = parseDateInput(updates.dueDate)
        }

        await taskRepository.update(idTenant, idBranch, taskId, dataToUpdate)

        await TaskAuditLogger.logUpdate({
            idTenant, idBranch,
            userId: currentUser.uid,
            userName: currentUser.firstName || currentUser.fullName,
            entityId: taskId,
            oldData: oldTask,
            newData: dataToUpdate
        })

        return true
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
        }, currentUser)
    },

    /**
     * Lista tarefas para hoje ou por filtro com enriquecimento de dados.
     */
    listTasks: async (idTenant, idBranch, filters = {}) => {
        try {
            const allTasks = await taskRepository.findAll(idTenant, idBranch)

            const { StaffService } = await import('./StaffService')
            const { ClientService } = await import('../Clients/ClientService')

            const [staffList, clientList] = await Promise.all([
                StaffService.listAll(idTenant, idBranch),
                ClientService.listClients(idTenant, idBranch)
            ])

            const staffMap = staffList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {})
            const clientMap = clientList.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})

            return TaskRules.filterAndEnrich(allTasks, staffMap, clientMap, filters)
        } catch (error) {
            console.error("Erro no TaskService.listTasks:", error)
            return []
        }
    },

    /**
     * Upload de anexo para tarefa.
     */
    uploadAttachment: async (idTenant, idBranch, taskId, file) => {
        const url = await StorageService.uploadDocument(file, {
            idTenant,
            idBranch,
            entityType: 'tasks',
            entityId: taskId
        })

        const attachment = {
            name: file.name,
            url,
            type: file.type,
            createdAt: new Date()
        }

        const task = await taskRepository.findById(idTenant, idBranch, taskId)
        const attachments = [...(task.attachments || []), attachment]

        await taskRepository.update(idTenant, idBranch, taskId, { attachments })

        return attachment
    }
}
