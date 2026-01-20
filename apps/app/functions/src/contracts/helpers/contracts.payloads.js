/**
 * Constrói o payload padronizado para criação/atualização de contrato
 * @param {Object} data - Dados brutos do contrato
 * @returns {Object} Payload sanitizado e validado
 */
exports.buildContractPayload = (data) => {
    return {
        title: data.title || "",
        status: data.status || "active",
        duration: Number(data.duration || 0),
        durationType: data.durationType || "Meses",
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
