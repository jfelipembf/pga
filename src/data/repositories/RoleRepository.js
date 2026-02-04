import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Funções/Cargos (Roles).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/roles
 */
class RoleRepository extends BaseRepository {
    constructor() {
        super('roles')
    }
}

export const roleRepository = new RoleRepository()
