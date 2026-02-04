import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Transações Financeiras (FinancialTransactions).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/financialTransactions
 */
class TransactionRepository extends BaseRepository {
    constructor() {
        super('financialTransactions')
    }

    /**
     * Busca transações de uma sessão de caixa específica.
     */
    async findBySession(idTenant, idBranch, idCashierSession) {
        return this.findWhere(idTenant, idBranch, [
            ['idCashierSession', '==', idCashierSession]
        ])
    }
}

export const transactionRepository = new TransactionRepository()
