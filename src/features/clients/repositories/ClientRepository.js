import { BaseRepository } from '../../../data/repositories/BaseRepository'

/**
 * Repositório específico para a entidade de Clientes.
 */
class ClientRepository extends BaseRepository {
    constructor() {
        super('clients')
    }

    /**
     * Buscar clientes por status usando a sintaxe modular.
     */
    async findByStatus(idTenant, idBranch, status) {
        return this.findWhere(idTenant, idBranch, [
            ['status', '==', status]
        ], { field: 'name', direction: 'asc' })
    }
}

export const clientRepository = new ClientRepository()
