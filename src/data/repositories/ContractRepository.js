import { BaseRepository } from "./BaseRepository";

/**
 * Repositório focado apenas na persistência de Contratos (Planos).
 * Não deve conter validações complexas de negócio, apenas CRUD e queries.
 */
export class ContractRepository extends BaseRepository {
    constructor() {
        super("contracts"); // Coleção 'contracts' dentro de tenant/branch
    }

    // Métodos específicos (se houver) além do CRUD padrão do BaseRepository
    // Ex: buscar contratos ativos para o Select de venda
    async findActiveContracts(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true],
            ['deleted', '==', false]
        ]);
    }
}

export const contractRepository = new ContractRepository();
