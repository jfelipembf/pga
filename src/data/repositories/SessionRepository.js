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
        const docs = await this.findWhere(idTenant, idBranch, [
            ['sessionDate', '>=', startDate],
            ['sessionDate', '<=', endDate]
        ]);

        return docs.filter(d => (d.deletedAt === null || d.deletedAt === undefined) && d.deleted !== true);
    }

    /**
     * Busca sessões ativas (não canceladas/deletadas)
     */
    async findActive(idTenant, idBranch) {
        const docs = await this.findAll(idTenant, idBranch);
        return docs.filter(d => (d.deletedAt === null || d.deletedAt === undefined) && d.deleted !== true);
    }

    /**
     * Busca sessões específicas de uma turma
     */
    async findByClass(idTenant, idBranch, idClass) {
        const docs = await this.findWhere(idTenant, idBranch, [
            ['idClass', '==', idClass]
        ])
        return docs.filter(d => (d.deletedAt === null || d.deletedAt === undefined) && d.deleted !== true);
    }
}

export const sessionRepository = new SessionRepository()
