import { BaseRepository } from './BaseRepository'

class ClientContractRepository extends BaseRepository {
    constructor() {
        super('client_contracts')
    }

    /**
     * Busca contratos ativos de um aluno
     */
    async findActiveByClient(idTenant, idBranch, idClient) {
        return this.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['status', '==', 'active']
        ])
    }
}

export const clientContractRepository = new ClientContractRepository()
