import { BaseRepository } from '../../../data/repositories/BaseRepository'

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
        return this.findWhere(idTenant, idBranch, [
            ['deletedAt', '==', null]
        ])
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
