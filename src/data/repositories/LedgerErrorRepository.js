import { BaseRepository } from "./BaseRepository";

/**
 * Repositório para erros contábeis não-bloqueantes.
 * 
 * Quando um lançamento no Ledger falha mas a operação financeira
 * continua (ex: pagamento confirmado mas lançamento contábil não criado),
 * o erro é persistido aqui para análise e correção posterior.
 * 
 * Coleção: tenants/{idTenant}/branches/{idBranch}/ledger_errors
 */
export class LedgerErrorRepository extends BaseRepository {
    constructor() {
        super("ledger_errors");
    }
}

export const ledgerErrorRepository = new LedgerErrorRepository();
