import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Sessões (Sessions).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/sessions
 */
class SessionRepository extends BaseRepository {
    constructor() {
        super('sessions')
    }

    /**
     * Busca sessões por intervalo de data
     * Suporta compatibilidade entre campos 'deleted' e 'deletedAt'
     */
    async findByDateRange(idTenant, idBranch, startDate, endDate) {
        return await this.findWhere(idTenant, idBranch, [
            ['sessionDate', '>=', startDate],
            ['sessionDate', '<=', endDate],
            ['deletedAt', '==', null]
        ]);
    }

    /**
     * Busca sessões ativas (não canceladas/deletadas)
     */
    async findActive(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true],
            ['deletedAt', '==', null]
        ]);
    }

    /**
     * Busca sessões específicas de uma turma
     */
    async findByClass(idTenant, idBranch, idClass) {
        return await this.findWhere(idTenant, idBranch, [
            ['idClass', '==', idClass],
            ['deletedAt', '==', null]
        ])
    }
}

export const sessionRepository = new SessionRepository()
