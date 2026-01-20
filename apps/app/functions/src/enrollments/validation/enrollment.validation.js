const { z } = require("zod");
const { toISODate } = require("../../helpers/date");

// Helper to sanitize date
const sanitizeDate = (val) => {
    if (typeof val === "string") {
        const iso = toISODate(val);
        return iso || val;
    }
    return val;
};

const BaseEnrollmentSchema = z.object({
    idClient: z.string().min(1, "idClient obrigatório"),
    idGym: z.string().optional(),
    status: z.enum(["active", "canceled", "suspended", "future"]).default("active"),
    origin: z.string().optional(),
    createdBy: z.string().optional(),
}).passthrough();

const RecurringEnrollmentSchema = BaseEnrollmentSchema.extend({
    idClass: z.string().min(1, "idClass obrigatório"),
    startDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida").optional().nullable()
    ),
    endDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim inválida").optional().nullable()
    ),
});

const SingleSessionEnrollmentSchema = BaseEnrollmentSchema.extend({
    idSession: z.string().min(1, "idSession obrigatório"),
    sessionDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data da sessão inválida")
    ),
    type: z.enum(["experimental", "single-session", "reposicao"]).default("single-session"),

    // Automation fields (optional)
    clientName: z.string().optional(),
    clientPhone: z.string().optional(),
    professionalName: z.string().optional(),
    startTime: z.string().optional(),
});

module.exports = {
    RecurringEnrollmentSchema,
    SingleSessionEnrollmentSchema
};
