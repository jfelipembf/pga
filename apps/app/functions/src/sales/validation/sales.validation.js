const { z } = require("zod");
const { toISODate } = require("../../helpers/date");

// Helper to sanitize date strings
const sanitizeDate = (val) => {
    if (typeof val === "string") {
        const iso = toISODate(val);
        return iso || val;
    }
    return val;
};

// Item Schema
const SaleItemSchema = z.object({
    itemType: z.enum(["contract", "service", "product", "generic"]).default("generic"),
    description: z.string().optional(),
    name: z.string().optional(),
    value: z.number().default(0), // Preço unitário ou total visual
    quantity: z.number().default(1),
}).passthrough(); // Permite outros campos (ex: idContract, params de recorrência)

// Payment Schema
const SalePaymentSchema = z.object({
    type: z.string(), // "credito", "debito", "dinheiro", "pix"
    method: z.string().optional(), // as vezes vem como method
    amount: z.preprocess((val) => Number(val), z.number().min(0)),
    installments: z.number().default(1).optional(),
}).passthrough();

// Main Sale Schema
const SaleSchema = z.object({
    idSale: z.string().nullable().optional(), // Para update

    idClient: z.string().nullable().optional(),
    clientName: z.string().nullable().optional(),

    idStaff: z.string().nullable().optional(),
    staffName: z.string().nullable().optional(),

    saleCode: z.string().nullable().optional(),
    saleDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)").or(z.literal("")).nullable().optional()
    ),

    status: z.enum(["open", "closed", "canceled"]).default("open"),

    items: z.array(SaleItemSchema).min(1, "A venda deve conter pelo menos um item."),

    payments: z.array(SalePaymentSchema).optional().default([]),

    totals: z.object({
        gross: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        discount: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        net: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        paid: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        pending: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        creditUsed: z.preprocess((v) => Number(v || 0), z.number().default(0)),
        creditGenerated: z.preprocess((v) => Number(v || 0), z.number().default(0)),
    }).passthrough(),

    notes: z.string().nullable().optional(),

    // Flags de negócio
    requiresEnrollment: z.boolean().optional(),
    enrollmentStatus: z.string().nullable().optional(),
}).passthrough();

module.exports = { SaleSchema };
