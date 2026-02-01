import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Contas a Pagar (Payables).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/payables
 */
class PayableRepository extends BaseRepository {
    constructor() {
        super('payables')
    }

    // Métodos específicos (como paginação complexa) podem ser adicionados aqui
    // se herdarem do BaseRepository, já ganham findAll, findById, create, update, delete.
}

export const payableRepository = new PayableRepository()
