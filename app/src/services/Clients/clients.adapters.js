// src/services/clients/clients.adapters.js

/**
 * Adapta transactions (financialTransactions) para um formato “lista financeira do cliente”.
 * Você pode ajustar os campos conforme seu UI.
 */
export const financialTxToClientRows = (transactions = []) =>
  (transactions || []).map(tx => {
    const amount = Number(tx.amount || 0)

    const status =
      tx.status ||
      (tx.type === "sale"
        ? "Pago"
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
