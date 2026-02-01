/**
 * Utilitários de Formatação Padrão do Sistema
 * Centraliza a lógica de exibição de valores monetários, documentos, telefones, etc.
 */

/**
 * Formata um valor numérico para o padrão de moeda BRL (R$).
 * Ex: 1250.5 -> "R$ 1.250,50"
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numberValue);
};

/**
 * Formata um valor numérico para percentual.
 * Ex: 0.15 -> "15,00%"
 * @param {number|string} value - Valor decimal (ex: 0.5 para 50%)
 * @param {number} decimals - Casas decimais (padrão 2)
 * @returns {string} Percentual formatado
 */
export const formatPercent = (value, decimals = 2) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return '0%';

    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(numberValue);
};

/**
 * Remove formatação de moeda para salvar no banco.
 * Ex: "R$ 1.250,50" -> 1250.50
 * @param {string} value - String formatada
 * @returns {number} Valor numérico
 */
export const parseCurrency = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;

    // Remove R$, espaços e converte , em .
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
};
