import { BaseRepository } from "./BaseRepository";

/**
 * Repositório focado apenas na persistência de Contratos (Planos).
 * Não deve conter validações complexas de negócio, apenas CRUD e queries.
 */
export class ContractRepository extends BaseRepository {
    constructor() {
        super("contracts"); // Coleção 'contracts' dentro de tenant/branch
    }

    /**
     * Lista planos ativos e visíveis
     */
    async findActivePlans(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true],
            ['deletedAt', '==', null]
        ]);
    }

    /**
     * Lista todos os planos não deletados (mesmo os inativos)
     */
    async findVisiblePlans(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['deletedAt', '==', null]
        ]);
    }
}

export const contractRepository = new ContractRepository();
