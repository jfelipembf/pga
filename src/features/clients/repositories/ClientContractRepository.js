import { BaseRepository } from '../../../data/repositories/BaseRepository'

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
            [['idClient', '==', idClient]]
        )
    }

    /**
     * Busca contratos ativos de um cliente.
     */
    async findActiveByClient(idTenant, idBranch, idClient) {
        const now = new Date()
        const contracts = await this.findWhere(
            idTenant,
            idBranch,
            [
                ['idClient', '==', idClient],
                ['status', '==', 'active']
            ]
        )
        // Filtro em memória para data (Firestore não suporta bem múltiplos filtros de desigualdade em campos diferentes sem índices compostos complexos)
        return contracts.filter(c => {
            const endDate = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate)
            return endDate >= now
        })
    }

    /**
     * Busca contratos estritamente ativos (status active E não vencidos)
     */
    async findStrictlyActive(idTenant, idBranch) {
        const now = new Date()
        const allActiveStatus = await this.findByStatus(idTenant, idBranch, 'active')
        return allActiveStatus.filter(c => {
            const endDate = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate)
            return endDate >= now
        })
    }

    /**
     * Busca contratos por status.
     */
    async findByStatus(idTenant, idBranch, status) {
        return this.findWhere(idTenant, idBranch, [
            ['status', '==', status]
        ])
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
