import moment from 'moment'

/**
 * Regras de Negócio para Tarefas
 */
export const TaskRules = {
    /**
     * Filtra e enriquece tarefas com dados de staff e clientes
     */
    filterAndEnrich: (tasks, staffMap, clientMap, filters = {}) => {
        const today = moment().startOf('day')

        return tasks.filter(task => {
            const taskDate = moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate)

            // Enriquecimento de Staff (Múltiplos)
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]
            task.assignedStaffDetails = assignees.map(id => {
                const s = staffMap[id]
                return s ? { id: s.id, name: s.name, photo: s.photo, role: s.roleName } : null
            }).filter(Boolean)

            // Enriquecimento de Alunos (Múltiplos)
            const clients = Array.isArray(task.relatedclients) ? task.relatedclients : []
            task.relatedclientsDetails = clients.map(id => {
                const c = clientMap[id]
                return c ? { id: c.id, name: c.name, photo: c.photoUrl } : null
            }).filter(Boolean)

            // Filtro por Staff (atribuído para)
            if (filters.assignedTo) {
                const taskAssignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]
                if (!taskAssignees.includes(filters.assignedTo)) return false
            }

            // Filtro por Status
            if (filters.status && task.status !== filters.status) return false

            // Lógica de Recorrência
            if (task.isRecurring) {
                if (task.recurrence?.frequency === 'daily') return true
                if (task.recurrence?.frequency === 'weekly') {
                    return task.recurrence?.daysOfWeek?.includes(today.day())
                }
                if (task.recurrence?.frequency === 'monthly') {
                    return task.recurrence?.dayOfMonth === today.date()
                }
            }

            return taskDate.isSame(today, 'day') || (task.status === 'pending' && taskDate.isBefore(today))
        }).sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 }
            return (priorities[b.priority] || 0) - (priorities[a.priority] || 0)
        })
    }
}
