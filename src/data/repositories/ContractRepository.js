import { BaseRepository } from './BaseRepository'

/**
 * Repository para gerenciar Contratos (Planos) no Firestore
 */
class ContractRepository extends BaseRepository {
    constructor() {
        super('contracts')
    }
}

export const contractRepository = new ContractRepository()
