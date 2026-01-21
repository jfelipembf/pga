/**
 * Utilitários para cálculos matemáticos comuns
 */

/**
 * Calcula percentual
 * @param {number} target - Valor alvo
 * @param {number} total - Valor total
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {number|null} Percentual calculado ou null
 */
const calculatePercent = (target, total, decimals = 1) => {
    if (!total || total === 0 || target === null || target === undefined) {
        return null;
    }
    return Number(((target / total) * 100).toFixed(decimals));
};

/**
 * Calcula variação percentual (delta)
 * @param {number} current - Valor atual
 * @param {number} previous - Valor anterior
 * @returns {string|null} Variação com sinal (+/-) ou null
 */
const calculateDelta = (current, previous) => {
    if (previous == null || previous === 0 || current == null) {
        return null;
    }
    const diff = ((current - previous) / previous) * 100;
    const rounded = Math.round(diff * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

/**
 * Calcula média
 * @param {number} value - Valor total
 * @param {number} count - Quantidade
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {number|null} Média calculada ou null
 */
const calculateAverage = (value, count, decimals = 1) => {
    if (!count || count === 0 || value === null || value === undefined) {
        return null;
    }
    return Number((value / count).toFixed(decimals));
};

/**
 * Formata número com separador de milhar
 * @param {number} value - Valor a ser formatado
 * @returns {string} Número formatado
 */
const formatNumber = (value) => {
    if (value === null || value === undefined) return "--";
    const num = Number(value);
    if (Number.isNaN(num)) return "--";
    return num.toLocaleString("pt-BR");
};

module.exports = {
    calculatePercent,
    calculateDelta,
    calculateAverage,
    formatNumber
};
