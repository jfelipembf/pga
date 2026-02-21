/**
 * Regras de Negócio para Contas a Receber (Receivables)
 */
export const ReceivableRules = {
    /**
     * Valida se um recebível pode ser liquidado
     */
    validateForSettlement: (receivable) => {
        if (!receivable) throw new Error("Título a receber não encontrado")
        if (receivable.status === 'paid') throw new Error("Título já está liquidado")
        if (receivable.deletedAt) throw new Error("Título já foi excluído")
    },

    /**
     * Valida se um recebível pode ser cancelado
     */
    validateForCancellation: (receivable) => {
        if (!receivable) throw new Error("Título não encontrado")
        if (receivable.status === 'paid') throw new Error("Não é possível cancelar um título já recebido.")
    },

    /**
     * Valida se um recebível pode ser deletado
     */
    validateForDeletion: (receivable) => {
        if (!receivable) throw new Error("Título não encontrado")
        if (receivable.status === 'paid') {
            throw new Error("SEGURANÇA: Não é possível excluir um título já pago. Cancele ou estorne o pagamento primeiro.")
        }
    },

    /**
     * Calcula dados da liquidação
     */
    calculateSettlement: (receivable, paymentData) => {
        const amountToPay = parseFloat(paymentData.amount) || receivable.pending
        const settlementAmount = Number(amountToPay)
        const feePercent = parseFloat(paymentData.estimatedFee) || receivable.feePercent || 0
        const feeAmount = feePercent > 0 ? (settlementAmount * (feePercent / 100)) : (receivable.feeAmount || 0)
        const netAmount = settlementAmount - feeAmount
        const remaining = Math.max(0, (receivable.pending || receivable.amount) - settlementAmount)

        return {
            settlementAmount,
            feePercent,
            feeAmount,
            netAmount,
            remaining,
            isFullyPaid: remaining <= 0.01
        }
    }
}
