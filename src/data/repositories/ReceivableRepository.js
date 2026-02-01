import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Contas a Receber (Receivables).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/receivables
 */
class ReceivableRepository extends BaseRepository {
    constructor() {
        super('receivables')
    }

    // Métodos específicos, ex: findBySaleId, findPending, etc.
}

export const receivableRepository = new ReceivableRepository()
