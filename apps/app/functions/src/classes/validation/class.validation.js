const { z } = require("zod");
const { toISODate } = require("../../helpers/date");

// Helper to sanitize date strings (strips time if present, handles null)
const sanitizeDate = (val) => {
    // Convert null/undefined/empty to null (Firestore accepts null but not undefined)
    if (val === null || val === undefined || val === "") return null;

    if (typeof val === "string") {
        // Use our robust helper which handles full ISO strings
        const iso = toISODate(val);
        return iso || null; // Return sanitized or null if invalid
    }
    return null;
};

// Common schema parts
const ClassSchema = z.object({
    // Basic Fields
    name: z.string().min(1, "Nome é obrigatório").optional(),
    description: z.string().optional().nullable(),

    // Relation IDs
    idActivity: z.string().min(1).optional().nullable(),
    idArea: z.string().min(1).optional().nullable(),
    idStaff: z.string().min(1).optional().nullable(),

    // Capacity & Time
    maxCapacity: z.preprocess(
        (val) => (val === null || val === undefined || val === "") ? undefined : Number(val),
        z.number().int().min(1, "Capacidade deve ser no mínimo 1").optional()
    ),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:mm)").optional().nullable(),
    durationMinutes: z.preprocess(
        (val) => (val === null || val === undefined || val === "") ? undefined : Number(val),
        z.number().int().min(1).optional()
    ),

    // Dates - Applied normalization (nullable)
    startDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)").optional().nullable()
    ),
    endDate: z.preprocess(
        sanitizeDate,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)").optional().nullable()
    ),

    // Weekdays - Preprocess to handle undefined/null
    weekDays: z.preprocess(
        (val) => {
            // Convert undefined/null to empty array
            if (val === undefined || val === null) return [];
            // Ensure it's an array
            if (Array.isArray(val)) return val;
            // Single value -> wrap in array
            return [val];
        },
        z.array(z.number().min(0).max(6)).optional().default([])
    ),

    // Cancellation
    // cancelAt: z.string().optional(), // if needed
}).passthrough(); // Allow other fields (idTenant, idBranch) to pass through if they are in the root object, though usually we extract them separately.

module.exports = { ClassSchema };
