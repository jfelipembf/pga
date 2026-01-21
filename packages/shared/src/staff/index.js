const { z } = require("../zod-setup");
const { AddressSchema, buildAddress } = require("../address");
const { sanitizeDate } = require("../common");

const StaffRole = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    RECEPTIONIST: 'receptionist',
    SALES: 'sales'
};

const StaffSchema = z.object({
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().optional().nullable(),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha curta").default("123456"),
    role: z.string().optional().nullable(),
    roleId: z.string().min(1, "Cargo é obrigatório"),
    isInstructor: z.boolean().default(false),
    status: z.enum(["active", "inactive"]).default("active"),
    phone: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    birthDate: z.preprocess(sanitizeDate, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    hireDate: z.preprocess(sanitizeDate, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    council: z.string().optional().nullable(),
    employmentType: z.string().optional().nullable(),
    salary: z.number().nullable().optional(),
    photo: z.string().optional().nullable(),
    address: AddressSchema.optional().nullable(),
}).passthrough();

const buildStaffPayload = (data) => {
    return {
        id: data.id, // Auth UID
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        password: data.password || "123456",
        role: data.role || "",
        roleId: data.roleId || "",
        isInstructor: !!data.isInstructor,
        status: data.status || "active",
        gender: data.gender || "",
        birthDate: sanitizeDate(data.birthDate),
        hireDate: sanitizeDate(data.hireDate || data.hiringDate),
        council: data.council || "",
        employmentType: data.employmentType || "",
        salary: data.salary ? Number(data.salary) : null,
        photo: data.photo || data.avatar || "",
        address: buildAddress(data)
    };
};

module.exports = {
    StaffRole,
    StaffSchema,
    buildStaffPayload
};
