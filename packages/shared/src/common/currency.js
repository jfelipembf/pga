/**
 * Utilitários para formatação de moeda
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param {number|string|null|undefined} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @param {string} options.nullPlaceholder - Texto a exibir quando valor é null/undefined (padrão: "--")
 * @returns {string} Valor formatado ou placeholder
 */
const formatCurrency = (value, options = {}) => {
    const { nullPlaceholder = "--" } = options;

    if (value === null || value === undefined) {
        return nullPlaceholder;
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
        return nullPlaceholder;
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
};

/**
 * Formata um valor numérico absoluto como moeda (sempre positivo)
 * @param {number|string|null|undefined} value - Valor a ser formatado
 * @returns {string} Valor absoluto formatado
 */
const formatCurrencyAbs = (value) => {
    return formatCurrency(Math.abs(Number(value) || 0));
};

module.exports = {
    formatCurrency,
    formatCurrencyAbs
};
