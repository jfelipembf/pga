// src/services/clients/clients.adapters.js

/**
 * Adapta transactions (financialTransactions) para um formato “lista financeira do cliente”.
 * Você pode ajustar os campos conforme seu UI.
 */
export const financialTxToClientRows = (transactions = []) =>
  (transactions || []).map(tx => {
    const amount = Number(tx.amount || 0)

    const isFuture = tx.date && new Date(tx.date) > new Date();

    const status =
      tx.status ||
      (tx.type === "sale"
        ? (isFuture ? "Agendado" : "Pago") // Vendas são pagas ou agendadas (cartão), nunca dívida aberta
        : tx.type === "expense"
          ? "Pago"
          : "Aberto")

    return {
      id: tx.id,
      idTransaction: tx.idTransaction || tx.transactionCode || tx.id,
      date: tx.date || null,
      type: tx.type || null, // "sale" | "expense" | "adjustment"
      description: tx.description || "",
      amount,
      method: tx.method || null,
      category: tx.category || null,
      source: tx.source || null,
      saleType: tx.saleType || null,
      status,
      raw: tx,
    }
  })

/**
 * Adapta um Recebível bruto para o formato de linha da tabela do cliente.
 */
export const normalizeReceivable = (r) => {
  const amount = Number(r.amount || 0)
  const paid = Number(r.amountPaid || 0)
  const pending = Math.max(amount - paid, 0)

  return {
    id: r.id,
    idTransaction: r.receivableCode || r.id,
    date: r.dueDate || null,
    type: "receivable",
    description: r.description || "Recebível",
    amount,
    paid,
    pending,
    status: r.status || "open",
    method: r.paymentType ? { type: r.paymentType } : null,
    raw: r,
  }
}
