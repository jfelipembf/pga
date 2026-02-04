import { BaseRepository } from "./BaseRepository";

/**
 * Repositório para Contas Bancárias (Itaú, Santander, Caixa Físico, etc)
 */
export class BankAccountRepository extends BaseRepository {
    constructor() {
        super("bank_accounts");
    }

    /**
     * Lista contas ativas e não deletadas
     */
    async findActive(idTenant, idBranch) {
        return this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true],
            ['deletedAt', '==', null]
        ])
    }

    /**
     * Lista todas as contas não deletadas (mesmo as inativas)
     */
    async findVisible(idTenant, idBranch) {
        return this.findWhere(idTenant, idBranch, [
            ['deletedAt', '==', null]
        ])
    }

    /**
     * Atualiza o saldo de uma conta bancária de forma atômica (se possível)
     * Nota: O ideal é usar transações no Service para isso.
     */
    async updateBalance(idTenant, idBranch, idAccount, newBalance) {
        return this.update(idTenant, idBranch, idAccount, {
            currentBalance: newBalance,
            updatedAt: new Date()
        })
    }
}

export const bankAccountRepository = new BankAccountRepository();
