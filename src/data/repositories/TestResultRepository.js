import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Resultados de Testes
 * Local: tenants/{idTenant}/branches/{idBranch}/test_results
 */
class TestResultRepository extends BaseRepository {
    constructor() {
        super('test_results')
    }

    /**
     * Busca um resultado específico de um aluno em um ciclo (evento) para uma atividade
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

    /**
     * Busca todos os resultados de um evento (Ciclo)
     */
    async findByEvent(idTenant, idBranch, idEvent) {
        return await this.findWhere(idTenant, idBranch, [
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
    }
}

export const testResultRepository = new TestResultRepository()
