/**
 * Distribui um valor de pagamento entre recebíveis em aberto (estratégia FIFO).
 * Os recebíveis mais antigos são pagos primeiro.
 * 
 * @param {Array} receivables - Lista de objetos receivable { id, pending, amount, paid, ... }
 * @param {number} totalPayment - Valor total sendo pago
 * @returns {object} { distribution: Array, remainingAmount: number, totalDistributed: number }
 */
function distributePaymentToReceivables(receivables, totalPayment) {
    let remainingAmount = Number(totalPayment);
    const distribution = [];
    let totalDistributed = 0;

    // Ordenar por data de vencimento (dueDate) ASC para pagar os mais antigos primeiro
    const sortedReceivables = [...receivables].sort((a, b) => {
        const dateA = new Date(a.dueDate || 0);
        const dateB = new Date(b.dueDate || 0);
        return dateA - dateB;
    });

    for (const rec of sortedReceivables) {
        if (remainingAmount <= 0) break;

        // Usar APENAS 'pending' como fonte de verdade
        const pending = Number(rec.pending || 0);

        if (pending <= 0) continue;

        const amountToPay = Math.min(pending, remainingAmount);
        const newPending = pending - amountToPay;
        const newPaid = Number(rec.paid || 0) + amountToPay;
        const willBeFullyPaid = newPending <= 0;

        distribution.push({
            idReceivable: rec.id,
            amountToPay: amountToPay,
            originalPending: pending,
            newPending: newPending,
            newPaid: newPaid,
            willBeFullyPaid: willBeFullyPaid,
        });

        remainingAmount -= amountToPay;
        totalDistributed += amountToPay;
    }

    return {
        distribution,
        remainingAmount,
        totalDistributed,
    };
}

module.exports = {
    distributePaymentToReceivables
};
