const { z } = require("../zod-setup");

const ClassSchema = z.object({
    idActivity: z.string().min(1, "Atividade é obrigatória"),
    idStaff: z.string().optional().nullable(),
    idArea: z.string().optional().nullable(),
    name: z.string().min(1, "Nome é obrigatório").default("Turma"),
    weekday: z.number().min(0).max(6).nullable(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:mm)").default("08:00"),
    endTime: z.string().optional().nullable(),
    durationMinutes: z.number().int().min(1).default(60),
    maxCapacity: z.number().int().min(1).default(20),
    active: z.boolean().default(true),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)").nullable().default(null),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)").nullable().default(null),
}).passthrough();

const ClassUpdateSchema = ClassSchema.partial();

const buildClassPayload = (data) => {
    return {
        idActivity: data.idActivity || null,
        idStaff: data.idStaff || null,
        idArea: data.idArea || null,
        name: data.name || "Turma",
        weekday: data.weekday ?? null,
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        durationMinutes: Number(data.durationMinutes || 60),
        maxCapacity: Number(data.maxCapacity || data.capacity || 20),
        active: data.active !== false,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
    };
};

module.exports = {
    ClassSchema,
    ClassUpdateSchema,
    buildClassPayload
};
