import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Catálogo de Produtos/Serviços (Catalog).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/catalog
 */
class CatalogRepository extends BaseRepository {
    constructor() {
        super('catalog')
    }
}

export const catalogRepository = new CatalogRepository()
