import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Contratos de Cliente.
 */
class ClientContractRepository extends BaseRepository {
    constructor() {
        super('clientContracts')
    }

    /**
     * Busca contratos de um cliente específico.
     */
    async findByClient(idTenant, idBranch, idClient) {
        return this.findWhere(
            idTenant,
            idBranch,
            [['idClient', '==', idClient]],
            { field: 'startDate', direction: 'desc' }
        )
    }

    /**
     * Busca contratos ativos de um cliente.
     */
    async findActiveByClient(idTenant, idBranch, idClient) {
        return this.findWhere(
            idTenant,
            idBranch,
            [
                ['idClient', '==', idClient],
                ['status', '==', 'active']
            ]
        )
    }

    /**
     * Busca contratos por status.
     */
    async findByStatus(idTenant, idBranch, status) {
        return this.findWhere(
            idTenant,
            idBranch,
            [['status', '==', status]],
            { field: 'startDate', direction: 'desc' }
        )
    }

    /**
     * Conta contratos por status (para agregações).
     */
    async countByStatus(idTenant, idBranch, status) {
        const contracts = await this.findByStatus(idTenant, idBranch, status)
        return contracts.length
    }
}

export const clientContractRepository = new ClientContractRepository()
