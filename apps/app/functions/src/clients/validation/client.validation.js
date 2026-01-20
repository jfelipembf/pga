const { z } = require("zod");
const { toISODate } = require("../../helpers/date");

// Helper to sanitize date strings (strips time if present)
const sanitizeDate = (val) => {
    if (typeof val === "string") {
        const iso = toISODate(val);
        return iso || val;
    }
    return val;
};

// Client Schema
const ClientSchema = z.object({
    // Identity
    name: z.string().min(1, "Nome é obrigatório").optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Email inválido").or(z.literal("")).optional(),

    // Contact
    phone: z.string().optional(),

    // Personal Data
    birthDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida (YYYY-MM-DD)").or(z.literal("")).optional().nullable()
    ),
    gender: z.string().optional(),
    document: z.string().optional(), // CPF/RG can range in format

    // Address (Nested or Flat - Schema handles flat, payload builder structures it)
    address: z.union([
        z.string(),
        z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            complement: z.string().optional(),
            neighborhood: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional()
        })
    ]).optional(),

    // Status
    status: z.string().default("active"),
    origin: z.string().optional(),

    // Allow extra
    photo: z.string().optional(),
}).passthrough();

module.exports = { ClientSchema };
