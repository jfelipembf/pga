/**
 * Regras de Negócio para Contas a Pagar (Payables)
 */
export const PayableRules = {
    /**
     * Valida se uma conta pode ser paga
     */
    validateForPayment: (payable) => {
        if (!payable) throw new Error("Conta não encontrada")
        if (payable.status === 'paid') throw new Error("Conta já está paga")
    },

    /**
     * Valida se uma conta pode ser deletada
     */
    validateForDeletion: (payable) => {
        if (!payable) throw new Error("Conta não encontrada")
        if (payable.status === 'paid') {
            throw new Error("SEGURANÇA: Não é possível excluir uma conta que já foi paga. Estorne o pagamento primeiro.")
        }
    },

    /**
     * Valida saldo bancário suficiente
     */
    validateBankBalance: (bankAccount, amount) => {
        if (!bankAccount) throw new Error("Conta bancária não encontrada")
        const currentBalance = Number(bankAccount.currentBalance || 0)
        if (currentBalance < amount) {
            throw new Error(`Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}`)
        }
    }
}
