const admin = require("firebase-admin");
const { FieldPath } = require("firebase-admin/firestore");
const { addDays, toISODate } = require("../../helpers/date");

/**
 * Process a list of raw payment objects from the frontend and generate a structured list of financial transactions.
 * Handles fee calculations, installments, and anticipation logic.
 *
 * @param {object} params
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {object} params.db - Firestore instance
 * @param {Array} params.payments - Array of payment objects { type, amount, installments, idAcquirer, ... }
 * @param {Date|string} params.saleDate - Date of the sale
 * @param {string} params.saleCode - Code of the sale
 * @returns {Promise<Array>} - Array of transaction payloads ready to be created
 */
const processPayments = async ({ idTenant, idBranch, db, payments, saleDate, saleCode }) => {
    if (!Array.isArray(payments) || payments.length === 0) return [];

    const transactions = [];

    // Batch fetch acquirers to avoid N+1 queries
    const acquirerIds = [...new Set(payments.map(p => p.idAcquirer).filter(Boolean))];
    const acquirersMap = new Map();

    if (acquirerIds.length > 0) {
        // Firestore "in" queries are limited to 10/30 items, usually fine here.
        // Optimization: we could cache this, but in a cloud function, simple fetch is safer.
        const acquirersRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/acquirers`);
        // Split into chunks if > 10, but rare case. Assuming < 10 for now.
        const snapshots = await acquirersRef.where(FieldPath.documentId(), "in", acquirerIds).get();
        snapshots.forEach(doc => {
            acquirersMap.set(doc.id, doc.data());
        });
    }

    for (const payment of payments) {
        const amount = Number(payment.amount || 0);
        if (amount <= 0) continue;

        const method = payment.type || "Outros";
        const isCard = method === "credito" || method === "debito";
        const idAcquirer = payment.idAcquirer;
        const acquirerConfig = acquirersMap.get(idAcquirer);

        if (isCard && acquirerConfig) {
            console.log(`[PaymentProcessor] Acquirer found: ${acquirerConfig.name}. Anticipate: ${acquirerConfig.anticipateReceivables}`);
        } else if (isCard && idAcquirer) {
            console.warn(`[PaymentProcessor] Acquirer ID ${idAcquirer} not found in database.`);
        }

        const installments = Number(payment.installments || 1);

        // Logic: Split into multiple future transactions ONLY if it's Credit + Multiple Installments + NOT Anticipated
        const shouldSplit = method === "credito" && installments > 1 && !acquirerConfig?.anticipateReceivables;

        if (shouldSplit) {
            // --- SPLIT TRANSACTION (Future Installments) ---
            const installmentAmount = amount / installments;

            // Find fee for this specific installment count
            const instFee = (acquirerConfig?.installmentFees || []).find(f => Number(f.installments) === installments);
            const feePercent = Number(instFee?.feePercent || 0);

            for (let i = 1; i <= installments; i++) {
                // Simple logic: 30 days per installment
                const receiptDate = addDays(saleDate, i * 30);
                const feeAmount = (installmentAmount * feePercent) / 100;
                const netAmount = installmentAmount - feeAmount;

                transactions.push({
                    type: "sale",
                    amount: netAmount,       // Net IN
                    grossAmount: installmentAmount, // Gross Processed
                    feeAmount,
                    date: toISODate(receiptDate),
                    method,
                    metadata: {
                        ...payment,
                        installment: i,
                        totalInstallments: installments,
                        acquirerName: acquirerConfig?.name
                    },
                    description: `Venda ${saleCode} (Parcela ${i}/${installments})` // Caller can override
                });
            }

        } else {
            // --- SINGLE TRANSACTION (Cash, Pix, Debit, or Anticipated Credit) ---
            let receiptDate = toISODate(saleDate);
            let feeAmount = 0;

            if (isCard && acquirerConfig) {
                // Calculate Receipt Date based on configuration (D+1, D+30, etc)
                const days = Number(acquirerConfig.receiptDays || 1);
                receiptDate = toISODate(addDays(saleDate, days));

                let feePercent = 0;

                if (method === "debito") {
                    feePercent = Number(acquirerConfig.debitFeePercent || 0);
                } else if (method === "credito") {
                    // Base Fee
                    if (installments === 1) {
                        feePercent = Number(acquirerConfig.creditOneShotFeePercent || 0);
                    } else {
                        const instFee = (acquirerConfig.installmentFees || []).find(f => Number(f.installments) === installments);
                        feePercent = Number(instFee?.feePercent || 0);
                    }

                    // Anticipation Fee (added on top)
                    if (acquirerConfig.anticipateReceivables) {
                        feePercent += Number(acquirerConfig.anticipationFeePercent || 0) * installments;
                    }
                }

                feeAmount = (amount * feePercent) / 100;
            }

            const netAmount = amount - feeAmount;

            transactions.push({
                type: "sale",
                amount: netAmount,       // Net IN
                grossAmount: amount,     // Gross Processed
                feeAmount,
                date: receiptDate,
                method,
                metadata: {
                    ...payment,
                    receiptDate,
                    idAcquirer,
                    acquirerName: acquirerConfig?.name || payment.acquirer
                },
                description: `Venda ${saleCode}` // Caller can override
            });
        }
    }

    return transactions;
};

module.exports = { processPayments };
