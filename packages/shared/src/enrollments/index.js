const { z } = require("../zod-setup");
const { sanitizeDate, toISODate } = require("../common");

const EnrollmentType = {
    RECURRING: 'recurring',
    EXPERIMENTAL: 'experimental',
    SINGLE: 'single-session'
};

const EnrollmentStatus = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended',
    FUTURE: 'future'
};

const EnrollmentSchema = z.object({
    idClient: z.string().min(1),
    idClass: z.string().optional().nullable(),
    idSession: z.string().optional().nullable(),
    idActivity: z.string().optional().nullable(),
    type: z.nativeEnum(EnrollmentType).default(EnrollmentType.RECURRING),
    status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
    startDate: z.preprocess(sanitizeDate, z.string().nullable()),
    endDate: z.preprocess(sanitizeDate, z.string().nullable()),
    sessionDate: z.preprocess(sanitizeDate, z.string().nullable()),
    clientName: z.string().default(""),
    activityName: z.string().default(""),
    className: z.string().default(""),
    idStaff: z.string().optional().nullable(),
    staffName: z.string().default(""),
    instructorId: z.string().optional().nullable(),
    instructorName: z.string().default(""),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
}).passthrough();

const buildEnrollmentPayload = (data) => {
    return {
        idClient: data.idClient,
        idClass: data.idClass || null,
        idSession: data.idSession || null,
        idActivity: data.idActivity || null,
        type: data.type || EnrollmentType.RECURRING,
        status: data.status || EnrollmentStatus.ACTIVE,
        startDate: sanitizeDate(data.startDate) || toISODate(new Date()),
        endDate: sanitizeDate(data.endDate),
        sessionDate: sanitizeDate(data.sessionDate),
        clientName: data.clientName || "",
        activityName: data.activityName || "",
        className: data.className || "",
        idStaff: data.idStaff || null,
        staffName: data.staffName || "",
        instructorId: data.instructorId || data.idStaff || null,
        instructorName: data.instructorName || "",
        startTime: data.startTime || null,
        endTime: data.endTime || null
    };
};

module.exports = {
    EnrollmentType,
    EnrollmentStatus,
    EnrollmentSchema,
    buildEnrollmentPayload
};
