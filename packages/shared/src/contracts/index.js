const { z } = require("../zod-setup");

const ContractStatus = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    ARCHIVED: "archived"
};

const DurationType = {
    MONTHS: "Meses",
    DAYS: "Dias",
    WEEKS: "Semanas",
    YEARS: "Anos"
};

const ContractSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),

    // Duration
    duration: z.number().min(0).default(0),
    durationType: z.nativeEnum(DurationType).default(DurationType.MONTHS),

    // Retention
    minPeriodStayMembership: z.number().min(0).default(0),

    // Enrollment Rules
    requiresEnrollment: z.boolean().default(false),
    maxWeeklyEnrollments: z.number().min(0).default(0),
    allowedWeekDays: z.array(z.number().min(0).max(6)).default([]),

    // Pricing
    value: z.number().min(0).default(0),
    maxAmountInstallments: z.number().min(1).default(1),

    // Suspension
    allowSuspension: z.boolean().default(false),
    suspensionMaxDays: z.number().min(0).default(0),
});

const buildContractPayload = (data) => {
    return {
        title: data.title || "",
        status: data.status || ContractStatus.ACTIVE,

        duration: Number(data.duration || 0),
        durationType: data.durationType || DurationType.MONTHS,
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),

        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments ?? data.weeklyLimit ?? 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],

        value: Number(data.value || 0),
        maxAmountInstallments: Number(data.maxAmountInstallments || 1),

        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),
    };
};

module.exports = {
    ContractStatus,
    DurationType,
    ContractSchema,
    buildContractPayload
};
