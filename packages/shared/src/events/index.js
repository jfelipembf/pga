const { z } = require("../zod-setup");
const { sanitizeDate } = require("../common");

const EventType = {
    EVALUATION: 'avaliacao',
    HOLIDAY: 'feriado',
    OTHER: 'outros'
};

const EventSchema = z.object({
    title: z.string().min(1, "Título é obrigatório").default("Evento"),
    description: z.string().optional(),
    type: z.nativeEnum(EventType).default(EventType.OTHER),

    // Date Range
    startDate: z.string().or(z.date()).transform(val => sanitizeDate(val)),
    endDate: z.string().or(z.date()).transform(val => sanitizeDate(val)),

    // Relations
    idArea: z.string().nullable().optional(),

    // Test Specifics
    testType: z.string().nullable().optional(),
    distanceMeters: z.number().min(0).default(0),
    targetTime: z.string().nullable().optional(),
    styles: z.string().optional(),

    active: z.boolean().default(true),
    photo: z.string().optional()
});

const buildEventPayload = (data) => {
    return {
        title: data.title || "Evento",
        description: data.description || "",
        type: data.type || EventType.OTHER,

        // Date Range
        startDate: sanitizeDate(data.startDate) || sanitizeDate(new Date()),
        endDate: sanitizeDate(data.endDate) || sanitizeDate(data.startDate) || sanitizeDate(new Date()),

        // Relations
        idArea: data.idArea || null,

        // Test Specifics
        testType: data.testType || null,
        distanceMeters: Number(data.distanceMeters || 0),
        targetTime: data.targetTime || null,
        styles: data.styles || "",

        active: data.active !== false,
        photo: data.photo || ""
    };
};

module.exports = {
    EventType,
    EventSchema,
    buildEventPayload
};
