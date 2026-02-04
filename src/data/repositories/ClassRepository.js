import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Turmas (Classes).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/classes
 */
class ClassRepository extends BaseRepository {
    constructor() {
        super('classes')
    }

    // Métodos herdados do BaseRepository: findAll, findById, findWhere, create, update, delete
}

export const classRepository = new ClassRepository()
