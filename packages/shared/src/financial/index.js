const { z } = require("../zod-setup");
const { sanitizeDate } = require("../common");

const ReceivableStatus = {
    OPEN: 'open',
    PAID: 'paid',
    PARTIALLY_PAID: 'partially_paid',
    CANCELED: 'canceled',
    OVERDUE: 'overdue'
};

const TransactionType = {
    INCOME: 'income',
    EXPENSE: 'expense',
    RECEIVABLE_PAYMENT: 'receivablePayment'
};

const PaymentMethod = {
    CASH: 'cash',
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PIX: 'pix',
    TRANSFER: 'transfer',
    BOLETO: 'boleto'
};

const buildReceivablePayload = (data) => {
    const amount = Number(data.amount || 0);
    const paid = Number(data.paid || 0);
    const pending = Number(data.pending !== undefined ? data.pending : (amount - paid));

    return {
        idClient: data.idClient || null,
        idSale: data.idSale || null,
        idContract: data.idContract || null,
        receivableCode: data.receivableCode || null,

        // Financial values
        amount,
        paid,
        pending,

        // Dates
        dueDate: sanitizeDate(data.dueDate) || sanitizeDate(new Date()),
        competenceDate: sanitizeDate(data.competenceDate) || sanitizeDate(data.dueDate) || sanitizeDate(new Date()),
        paidAt: data.paidAt || null,

        // Status
        status: data.status || ReceivableStatus.OPEN,
        description: data.description || "Saldo Devedor",

        // Payment Details
        paymentType: data.paymentType || null,
        currentInstallment: Number(data.currentInstallment || 1),
        totalInstallments: Number(data.totalInstallments || 1),

        // Card Info
        cardAcquirer: data.cardAcquirer || null,
        cardBrand: data.cardBrand || null,
        cardAuthorization: data.cardAuthorization || null,

        // History
        lastPaymentAt: data.lastPaymentAt || null,
        lastPaymentMethod: data.lastPaymentMethod || null,
        notes: data.notes || ""
    };
};

const buildTransactionPayload = (data) => {
    return {
        idTransaction: data.idTransaction || null,
        transactionCode: data.transactionCode || null,

        type: data.type || TransactionType.EXPENSE,
        category: data.category || "Geral",
        description: data.description || "",

        amount: Number(data.amount || 0),
        grossAmount: Number(data.grossAmount || data.amount || 0),
        netAmount: Number(data.netAmount || data.amount || 0),
        feeAmount: Number(data.feeAmount || 0),

        date: sanitizeDate(data.date) || sanitizeDate(new Date()),
        method: data.method || PaymentMethod.CASH,
        status: data.status || "completed",

        // Relationships
        source: data.source || "manual",
        idSale: data.idSale || null,
        idContract: data.idContract || null,
        idProduct: data.idProduct || null,
        idService: data.idService || null,
        idClient: data.idClient || null,

        // Collections
        receivableIds: Array.isArray(data.receivableIds) ? data.receivableIds : [],

        // Card Specifics
        cardAuthorization: data.cardAuthorization || null,
        cardAcquirer: data.cardAcquirer || null,
        cardBrand: data.cardBrand || null,
        cardInstallments: data.cardInstallments ? Number(data.cardInstallments) : null,

        metadata: data.metadata || {}
    };
};

module.exports = {
    ReceivableStatus,
    TransactionType,
    PaymentMethod,
    buildReceivablePayload,
    buildTransactionPayload
};
