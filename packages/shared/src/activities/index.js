const { z } = require("../zod-setup");

const ActivitySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").default("Nova Atividade"),
    description: z.string().optional(),
    color: z.string().default("#3c5068"),
    status: z.string().default("ativo"),

    // Instructor override for entire activity
    idStaff: z.string().nullable().optional(),
    instructor: z.string().nullable().optional(), // Optional denormalized name

    // Configs
    maxCapacity: z.number().min(0).default(20),
    durationMinutes: z.number().min(1).default(60),

    active: z.boolean().default(true),
    // deleted: z.boolean().default(false), // internal flag usually not in builder
    photo: z.string().optional()
});

const buildActivityPayload = (data) => {
    return {
        name: data.name || "Nova Atividade",
        description: data.description || "",
        color: data.color || "#3c5068",
        status: data.status || "ativo",

        // Instructor override for entire activity
        idStaff: data.idStaff || data.idInstructor || data.instructorId || null,
        instructor: data.instructor || null, // Optional denormalized name

        // Configs
        maxCapacity: Number(data.maxCapacity || data.capacity || 20),
        durationMinutes: Number(data.durationMinutes || 60),

        active: data.active !== false,
        deleted: false,
        photo: data.photo || ""
    };
};

module.exports = {
    ActivitySchema,
    buildActivityPayload
};
