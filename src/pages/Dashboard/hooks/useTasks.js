import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../hooks/useTenant'
import { useAuth } from '../../../hooks/useAuth'
import { TaskService } from '../../../services/Admin/TaskService'
import { toast } from 'react-toastify'

/**
 * Hook para gerenciar o estado das tarefas no Dashboard.
 */
export const useTasks = (filters = {}) => {
    const { idTenant, idBranch } = useTenant()
    const { user } = useAuth()

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    const filtersKey = JSON.stringify(filters)

    const fetchTasks = useCallback(async () => {
        if (!idTenant || !idBranch) return

        try {
            setLoading(true)
            const data = await TaskService.listTasks(idTenant, idBranch, filters)
            setTasks(data)
        } catch (error) {
            console.error("Erro ao carregar tarefas:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filtersKey])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const createTask = async (taskData) => {
        try {
            await TaskService.create(idTenant, idBranch, taskData, user)
            toast.success("Tarefa criada com sucesso!")
            fetchTasks()
        } catch (error) {
            toast.error("Erro ao criar tarefa")
            throw error
        }
    }

    const completeTask = async (taskId) => {
        try {
            await TaskService.complete(idTenant, idBranch, taskId, user)
            toast.success("Tarefa concluída!")
            fetchTasks()
        } catch (error) {
            toast.error("Erro ao concluir tarefa")
        }
    }

    const uploadAttachment = async (taskId, file) => {
        try {
            await TaskService.uploadAttachment(idTenant, idBranch, taskId, file)
            toast.success("Anexo enviado!")
            fetchTasks()
        } catch (error) {
            toast.error("Erro ao enviar anexo")
        }
    }

    return {
        tasks,
        loading,
        refresh: fetchTasks,
        createTask,
        completeTask,
        uploadAttachment
    }
}
