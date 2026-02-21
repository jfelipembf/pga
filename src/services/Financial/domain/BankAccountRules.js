/**
 * Regras de Negócio para Contas Bancárias (BankAccounts)
 */
export const BankAccountRules = {
    /**
     * Valida se uma conta pode ser deletada
     */
    validateForDeletion: async (idTenant, idBranch, id) => {
        const { transactionRepository } = await import('../../../data/repositories/TransactionRepository')
        const transactions = await transactionRepository.findWhere(idTenant, idBranch, [
            ['idBankAccount', '==', id],
            ['deletedAt', '==', null]
        ], null, 1)

        if (transactions.length > 0) {
            throw new Error("SEGURANÇA: Esta conta possui histórico de transações e não pode ser excluída para preservar a integridade financeira. Sugestão: Apenas desative a conta.")
        }
    },

    /**
     * Valida se é conta principal
     */
    validateNotPrimary: (account) => {
        if (account?.isPrimary) {
            throw new Error("SEGURANÇA: Não é possível excluir a conta principal do sistema.")
        }
    }
}
