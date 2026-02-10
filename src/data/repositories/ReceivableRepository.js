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

    /**
     * Busca recebíveis de uma venda específica
     */
    async findBySaleId(idTenant, idBranch, idSale) {
        return this.findWhere(idTenant, idBranch, [['idSale', '==', idSale]]);
    }

    /**
     * Busca recebíveis pendentes de um cliente
     */
    async findPendingByClient(idTenant, idBranch, idClient) {
        return this.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['status', '==', 'open']
        ]);
    }

    /**
     * Busca recebíveis atrasados (vencidos e não pagos)
     * Requer índice composto no Firestore (status + dueDate)
     */
    async findOverdue(idTenant, idBranch, referenceDate = new Date()) {
        return this.findWhere(idTenant, idBranch, [
            ['status', '==', 'open'],
            ['dueDate', '<', referenceDate]
        ]);
    }
}

export const receivableRepository = new ReceivableRepository()
