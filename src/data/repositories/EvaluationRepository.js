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

    /**
     * Busca uma avaliação específica de um aluno em um ciclo (evento) para uma atividade
     */
    async findByStudentActivityEvent(idTenant, idBranch, idStudent, idActivity, idEvent) {
        const results = await this.findWhere(idTenant, idBranch, [
            ['idStudent', '==', idStudent],
            ['idActivity', '==', idActivity],
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
        return results.length > 0 ? results[0] : null
    }
}

export const evaluationRepository = new EvaluationRepository()
