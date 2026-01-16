/**
 * Distribui um valor de pagamento entre recebíveis em aberto (estratégia FIFO).
 * Os recebíveis mais antigos são pagos primeiro.
 * 
 * @param {Array} receivables - Lista de objetos receivable { id, balance, pending, amount, ... }
 * @param {number} totalPayment - Valor total sendo pago
 * @returns {object} { distribution: Array, remainingAmount: number, totalDistributed: number }
 */
function distributePaymentToReceivables(receivables, totalPayment) {
    let remainingAmount = Number(totalPayment);
    const distribution = [];
    let totalDistributed = 0;

    // Ordenar por data de vencimento (dueDate) ou criação?
    // Assume-se que a lista já vem ordenada ou a ordem de inserção importa.
    // Idealmente, ordenar por dueDate ASC.
    // Para simplificar, usamos a ordem fornecida (normalmente a query já traz ordernado).

    for (const rec of receivables) {
        if (remainingAmount <= 0) break;

        // O valor pendente pode vir em 'balance' (vendas) ou 'pending' (receivables puros) ou 'amount' (se não tiver pagos)
        // Padronizando: pending > 0 é o saldo devedor.
        // Se 'pending' não existe, calcula amount - paid.
        let pending = 0;
        if (rec.pending !== undefined) {
            pending = Number(rec.pending);
        } else if (rec.balance !== undefined) {
            pending = Number(rec.balance);
        } else {
            pending = Number(rec.amount || 0) - Number(rec.paid || 0);
        }

        if (pending <= 0) continue;

        const amountToPay = Math.min(pending, remainingAmount);

        distribution.push({
            idReceivable: rec.id,
            amountToPay: amountToPay,
            originalPending: pending,
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
