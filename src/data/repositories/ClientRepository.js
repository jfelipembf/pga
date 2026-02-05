import { BaseRepository } from './BaseRepository'

/**
 * Repositório específico para a entidade de Clientes.
 */
class ClientRepository extends BaseRepository {
    constructor() {
        super('clients')
    }

    /**
     * Lista todos os clientes ativos (não deletados)
     */
    async findActive(idTenant, idBranch) {
        const docs = await this.findAll(idTenant, idBranch)
        return docs.filter(d => (d.deletedAt === null || d.deletedAt === undefined) && d.deleted !== true)
    }

    /**
     * Buscar clientes por status usando a sintaxe modular.
     */
    async findByStatus(idTenant, idBranch, status) {
        return this.findWhere(idTenant, idBranch, [
            ['lifecycleStatus', '==', status],
            ['deletedAt', '==', null]
        ])
    }
}

export const clientRepository = new ClientRepository()
