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

    /**
     * Busca contas por status
     */
    async findByStatus(idTenant, idBranch, status) {
        return this.findWhere(idTenant, idBranch, [['status', '==', status]]);
    }

    /**
     * Busca contas atrasadas
     */
    async findOverdue(idTenant, idBranch, referenceDate = new Date()) {
        return this.findWhere(idTenant, idBranch, [
            ['status', '==', 'open'],
            ['dueDate', '<', referenceDate]
        ]);
    }
}

export const payableRepository = new PayableRepository()
