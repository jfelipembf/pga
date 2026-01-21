const { z } = require("../zod-setup");
const { sanitizeDate } = require("../common");

const ClientDebtSchema = z.object({
    idReceivable: z.string().nullable().optional(),
    idSale: z.string().nullable().optional(),

    amount: z.number().min(0).default(0),
    balance: z.number().min(0).default(0),

    dueDate: z.string().or(z.date()).transform(val => sanitizeDate(val)),
    status: z.string().default("open"),
    description: z.string().default("Dívida"),

    createdAt: z.string().or(z.date()).nullable().optional()
});

const buildClientDebtPayload = (data) => {
    return {
        idReceivable: data.idReceivable || data.id || null, // Global ID
        idSale: data.idSale || null,

        amount: Number(data.amount || 0),
        balance: Number(data.balance !== undefined ? data.balance : data.amount || 0),

        dueDate: sanitizeDate(data.dueDate) || sanitizeDate(new Date()),
        status: data.status || "open",
        description: data.description || "Dívida",

        createdAt: data.createdAt || null,
    };
};

module.exports = {
    ClientDebtSchema,
    buildClientDebtPayload
};
