const {
    toMonthKey,
    monthRangeFromKey,
} = require("../../shared");

/**
 * Verifica se o status indica presença.
 * @param {string|number} status 
 * @returns {boolean}
 */
const isPresentStatus = (status) => {
    if (status === null || status === undefined) return false;
    const n = Number(status);
    if (!Number.isNaN(n)) return n === 0;
    return String(status).toLowerCase() === "present";
};

module.exports = {
    toMonthKey,
    monthRangeFromKey,
    isPresentStatus,
};

