import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Níveis de Avaliação
 */
class EvaluationLevelRepository extends BaseRepository {
    constructor() {
        super('evaluationLevels')
    }

    /**
     * Lista todos os níveis ordenados por 'order'
     */
    async findAllOrdered(idTenant, idBranch) {
        const levels = await this.findAll(idTenant, idBranch)
        return levels
            .filter(level => !level.deletedAt)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    /**
     * Busca nível por valor
     */
    async findByValue(idTenant, idBranch, value) {
        const levels = await this.findAll(idTenant, idBranch)
        return levels.find(level => 
            level.value === value && 
            !level.deletedAt
        )
    }

    /**
     * Atualiza a ordem de múltiplos níveis
     */
    async updateOrder(idTenant, idBranch, orderedIds) {
        const updates = orderedIds.map((id, index) => 
            this.update(idTenant, idBranch, id, { order: index })
        )
        return Promise.all(updates)
    }
}

export const evaluationLevelRepository = new EvaluationLevelRepository()
