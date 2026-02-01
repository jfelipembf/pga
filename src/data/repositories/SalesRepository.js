import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Vendas (Sales).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/sales
 */
class SalesRepository extends BaseRepository {
    constructor() {
        super('sales')
    }

    // Métodos específicos de busca podem ser adicionados aqui
    // Ex: findByClient, findByDateRange, etc.
}

export const salesRepository = new SalesRepository()
