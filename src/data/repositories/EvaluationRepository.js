import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Avaliações (Evaluations).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/evaluations
 */
class EvaluationRepository extends BaseRepository {
    constructor() {
        super('evaluations')
    }

    /**
     * Busca avaliações de um aluno específico
     */
    async findByClient(idTenant, idBranch, idClient) {
        return this.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['deletedAt', '==', null]
        ], { field: 'date', direction: 'desc' })
    }

    /**
     * Busca avaliações realizadas em uma sessão específica
     */
    async findBySession(idTenant, idBranch, idSession) {
        return this.findWhere(idTenant, idBranch, [
            ['idSession', '==', idSession],
            ['deletedAt', '==', null]
        ])
    }

    /**
     * Busca uma avaliação específica de um aluno em um ciclo (evento) para uma atividade
     */
    async findByClientActivityEvent(idTenant, idBranch, idClient, idActivity, idEvent) {
        const results = await this.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['idActivity', '==', idActivity],
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
        return results.length > 0 ? results[0] : null
    }
}

export const evaluationRepository = new EvaluationRepository()
