import { useState, useEffect, useCallback } from 'react'
import moment from 'moment'
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
        if (!idTenant || !idBranch || !user) return

        try {
            setLoading(true)
            const [tasksData, trialsSnapshot] = await Promise.all([
                TaskService.listTasks(idTenant, idBranch, filters),
                (async () => {
                    // Buscar Experimentais do usuário para hoje
                    const { enrollmentRepository } = await import('../../../data/repositories/EnrollmentRepository');
                    const { query, where, getDocs } = await import('firebase/firestore');

                    const todayStr = moment().format('YYYY-MM-DD');
                    const q = query(
                        enrollmentRepository.getCollectionRef(idTenant, idBranch),
                        where('enrollmentType', '==', 'trial'),
                        where('createdBy', '==', user.uid),
                        where('startDate', '==', todayStr), // Assumindo que startDate é YYYY-MM-DD string conforme schema
                        where('status', '==', 'active')
                    );
                    return getDocs(q);
                })()
            ]);

            const tasks = tasksData || [];

            const trials = [];
            if (trialsSnapshot) {
                trialsSnapshot.forEach(doc => {
                    const data = doc.data();
                    trials.push({
                        id: doc.id,
                        title: `Experimental: ${data.clientName}`,
                        description: `${data.activityName} - ${data.startTime}`,
                        category: 'trial', // Categoria específica
                        priority: 'high',
                        status: 'pending',
                        dueDate: moment(data.startDate).toDate(), // Converter para objeto Date para compatibilidade
                        assignedTo: user.uid,
                        assignedStaffDetails: [{
                            id: user.uid,
                            name: user.displayName || 'Eu',
                            photo: user.photoURL
                        }],
                        isTrial: true
                    });
                });
            }

            // Merge e Ordenação
            const merged = [...tasks, ...trials].sort((a, b) => {
                // Prioridade para Experimentais
                if (a.category === 'trial' && b.category !== 'trial') return -1;
                if (b.category === 'trial' && a.category !== 'trial') return 1;

                // Depois por prioridade normal
                const priorities = { high: 3, medium: 2, low: 1 };
                return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
            });

            setTasks(merged)
        } catch (error) {
            console.error("Erro ao carregar tarefas:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filtersKey, user])

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

    const completeTask = async (taskId, newStatus = 'completed') => {
        try {
            if (newStatus === 'completed') {
                await TaskService.complete(idTenant, idBranch, taskId, user)
                toast.success("Tarefa concluída!")
            } else {
                await TaskService.update(idTenant, idBranch, taskId, {
                    status: 'pending',
                    completedAt: null,
                    completedBy: null,
                    completedByName: null
                }, user)
                toast.success("Tarefa marcada como pendente")
            }
            fetchTasks()
        } catch (error) {
            console.error("Erro ao atualizar tarefa:", error)
            toast.error("Erro ao atualizar tarefa")
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
