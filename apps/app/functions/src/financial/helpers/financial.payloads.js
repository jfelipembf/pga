const { toISODate } = require("../../helpers/date");
const asString = (val) => (val !== undefined && val !== null ? String(val) : null);

/**
 * Constrói o payload padronizado para receivable (conta a receber)
 */
exports.buildReceivablePayload = (data) => {
    // Calculate financial values (NEVER undefined, always number)
    const amount = Number(data.amount || 0);
    const paid = Number(data.paid || 0);
    const pending = Number(data.pending !== undefined ? data.pending : (amount - paid));

    return {
        idClient: asString(data.idClient),
        idSale: asString(data.idSale) || null,
        idContract: asString(data.idContract) || null,
        receivableCode: data.receivableCode || null,

        // Financial values (ALWAYS number, NEVER undefined)
        amount: amount,
        paid: paid,
        pending: pending,

        // Dates
        dueDate: data.dueDate || toISODate(new Date()),
        competenceDate: data.competenceDate || data.dueDate || toISODate(new Date()),
        paidAt: data.paidAt || null,

        // Status
        status: data.status || "open",

        // Description
        description: data.description || "Saldo Devedor",

        // Payment type
        paymentType: data.paymentType || null,

        // Installments
        currentInstallment: Number(data.currentInstallment || 1),
        totalInstallments: Number(data.totalInstallments || 1),

        // Card Info (sem fallbacks - apenas campos padronizados)
        cardAcquirer: data.cardAcquirer || null,
        cardBrand: data.cardBrand || null,
        cardAuthorization: data.cardAuthorization || null,

        // Payment history
        lastPaymentAt: data.lastPaymentAt || null,
        lastPaymentMethod: data.lastPaymentMethod || null,

        // Notes
        notes: data.notes || "",
    };
};

/**
 * Constrói o payload padronizado para transaction (transação financeira)
 */
exports.buildTransactionPayload = (data) => {
    return {
        // Core
        idTransaction: data.idTransaction || null,
        transactionCode: data.transactionCode || null,

        type: data.type || "expense",
        category: data.category || "Geral",
        description: data.description || "",
        amount: Number(data.amount || 0),
        grossAmount: Number(data.grossAmount || data.amount || 0),
        netAmount: Number(data.netAmount || data.amount || 0),
        feeAmount: Number(data.feeAmount || 0),
        date: data.date || toISODate(new Date()),
        method: data.method || "Dinheiro",
        status: data.status || "completed",

        // Relationships
        source: data.source || "manual",
        idSale: asString(data.idSale),
        idContract: asString(data.idContract),
        idProduct: asString(data.idProduct),
        idService: asString(data.idService),
        idClient: asString(data.idClient),

        // Collections
        receivableIds: Array.isArray(data.receivableIds) ? data.receivableIds : [],

        // Card Specifics (sem fallbacks)
        cardAuthorization: data.cardAuthorization || null,
        cardAcquirer: data.cardAcquirer || null,
        cardBrand: data.cardBrand || null,
        cardInstallments: data.cardInstallments ? Number(data.cardInstallments) : null,

        metadata: data.metadata || {},
    };
};

/**
 * Constrói o payload para dívida de cliente (legacy - considerar deprecar)
 */
exports.buildClientDebtPayload = (data) => {
    const amount = Number(data.amount || 0);
    const paid = Number(data.paid || 0);
    const pending = Number(data.pending !== undefined ? data.pending : (amount - paid));

    return {
        idReceivable: asString(data.idReceivable || data.id),
        idSale: asString(data.idSale),
        amount: amount,
        paid: paid,
        pending: pending,
        dueDate: data.dueDate || toISODate(new Date()),
        status: data.status || "open",
        description: data.description || "Dívida",
        createdAt: data.createdAt || null,
    };
};
