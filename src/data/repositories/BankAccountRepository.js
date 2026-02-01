import { BaseRepository } from "./BaseRepository";

/**
 * Repositório para Contas Bancárias (Itaú, Santander, Caixa Físico, etc)
 */
export class BankAccountRepository extends BaseRepository {
    constructor() {
        super("bank_accounts");
    }

    async findActive(idTenant, idBranch) {
        return this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true]
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
