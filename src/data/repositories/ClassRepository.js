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

    /**
     * Lista todas as turmas ativas
     */
    async findActive(idTenant, idBranch) {
        return this.findWhere(idTenant, idBranch, [
            ['deletedAt', '==', null],
            ['isActive', '==', true]
        ])
    }
}

export const classRepository = new ClassRepository()
