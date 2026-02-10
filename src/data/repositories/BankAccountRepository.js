import { BaseRepository } from "./BaseRepository";
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

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
     * Ajusta o saldo de uma conta bancária de forma ATÔMICA usando Firestore increment().
     * Isso elimina race conditions: não precisa ler o saldo antes de atualizar.
     * 
     * @param {string} idTenant
     * @param {string} idBranch
     * @param {string} idAccount - ID da conta bancária
     * @param {number} delta - Valor a ajustar (positivo = crédito, negativo = débito)
     * @returns {Promise<void>}
     * 
     * @example
     * // Creditar R$ 500 na conta
     * await bankAccountRepository.adjustBalance(idTenant, idBranch, idAccount, 500);
     * 
     * // Debitar R$ 200 da conta
     * await bankAccountRepository.adjustBalance(idTenant, idBranch, idAccount, -200);
     */
    async adjustBalance(idTenant, idBranch, idAccount, delta) {
        if (typeof delta !== 'number' || isNaN(delta)) {
            throw new Error(`adjustBalance: delta inválido (${delta}). Deve ser um número.`);
        }
        if (delta === 0) return; // Nenhuma operação necessária

        const ref = doc(this.getCollectionRef(idTenant, idBranch), idAccount);
        await updateDoc(ref, {
            currentBalance: increment(delta),
            updatedAt: serverTimestamp()
        });
    }

    /**
     * @deprecated Use adjustBalance() para operações atômicas.
     * Mantido apenas para ajustes manuais de saldo absoluto (ex: tela de admin).
     */
    async updateBalance(idTenant, idBranch, idAccount, newBalance) {
        return this.update(idTenant, idBranch, idAccount, {
            currentBalance: newBalance,
            updatedAt: new Date()
        })
    }
}

export const bankAccountRepository = new BankAccountRepository();
