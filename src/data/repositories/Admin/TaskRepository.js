import { BaseRepository } from '../BaseRepository'

/**
 * Repositório para Gestão de Tarefas.
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/tasks
 */
class TaskRepository extends BaseRepository {
    constructor() {
        super('tasks')
    }

    /**
     * Busca tarefas pendentes para um colaborador específico.
     */
    async findPendingByStaff(idTenant, idBranch, userId) {
        return this.findWhere(idTenant, idBranch, [
            ['assignedTo', '==', userId],
            ['status', '==', 'pending']
        ])
    }

    /**
     * Busca tarefas de um dia específico (ou recorrentes).
     */
    async findByDate(idTenant, idBranch, date) {
        // Implementação básica de busca por data. 
        // Para recorrência real, o service fará a lógica de filtrar.
        return this.findWhere(idTenant, idBranch, [
            ['dueDate', '>=', date.startOf('day').toDate()],
            ['dueDate', '<=', date.endOf('day').toDate()]
        ])
    }
}

export const taskRepository = new TaskRepository()
