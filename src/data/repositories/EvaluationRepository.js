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
    async findByStudent(idTenant, idBranch, idStudent) {
        return this.findWhere(idTenant, idBranch, [
            ['idStudent', '==', idStudent],
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
}

export const evaluationRepository = new EvaluationRepository()
