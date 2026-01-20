const { toISODate } = require("../../helpers/date");
const asString = (val) => (val !== undefined && val !== null ? String(val) : null);

/**
 * Constrói o payload padronizado para criação/atualização de contrato de cliente
 * @param {Object} data - Dados brutos do contrato do cliente
 * @returns {Object} Payload sanitizado e validado
 */
exports.buildClientContractPayload = (data) => {
    return {
        idClient: asString(data.idClient),
        idContract: asString(data.idContract),
        idSale: asString(data.idSale),
        idSaleItem: asString(data.idSaleItem),
        contractTitle: data.contractTitle || data.title || "",
        contractCode: data.contractCode || null,
        status: data.status || "active",
        startDate: data.startDate || toISODate(new Date()),
        endDate: data.endDate || null,
        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments || 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],
        enrollmentStatus: data.enrollmentStatus || "pending",
        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),
        totalSuspendedDays: Number(data.totalSuspendedDays || 0),
        pendingSuspensionDays: Number(data.pendingSuspensionDays || 0),
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),
        billing: data.billing || "--",
        balanceDays: Number(data.balanceDays ?? data.daysBalance ?? 0),
        notes: data.notes || "",
    };
};
