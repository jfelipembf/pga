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

// Staff Schema
const StaffSchema = z.object({
    // Identity
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().optional().nullable(),
    email: z.string().email("Email inválido"),

    // Auth & Access
    password: z.string().min(6, "Senha muito curta").default("123456"),
    role: z.string().optional().nullable(),
    roleId: z.string().min(1, "Cargo é obrigatório"),
    isInstructor: z.boolean().default(false).optional(),
    status: z.enum(["active", "inactive"]).default("active"),

    // Contact
    phone: z.string().optional().nullable(),

    // Personal Data
    gender: z.string().optional().nullable(),
    birthDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida (YYYY-MM-DD)").or(z.literal("")).optional().nullable()
    ),

    // Professional Data
    hireDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de contratação inválida").or(z.literal("")).optional().nullable()
    ),
    council: z.string().optional().nullable(),
    employmentType: z.string().optional().nullable(),
    salary: z.preprocess(
        (val) => (val ? Number(val) : null),
        z.number().nullable().optional()
    ),

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
    ]).optional().nullable(),

    // Allow extra
    photo: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
}).passthrough();

module.exports = { StaffSchema };
