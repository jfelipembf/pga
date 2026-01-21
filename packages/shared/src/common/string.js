/**
 * Utilitários para manipulação e formatação de strings
 */

/**
 * Capitaliza a primeira letra de cada palavra
 * @param {string} str - String a ser capitalizada
 * @returns {string} String com primeira letra de cada palavra maiúscula
 */
const capitalizeWords = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
};

/**
 * Capitaliza apenas a primeira letra da string
 * @param {string} str - String a ser capitalizada
 * @returns {string} String com primeira letra maiúscula
 */
const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Normaliza string para busca (lowercase + trim)
 * @param {any} value - Valor a ser normalizado
 * @returns {string} String normalizada para busca
 */
const normalizeForSearch = (value) => {
    return String(value || "").toLowerCase().trim();
};

/**
 * Normaliza status (lowercase + trim)
 * @param {any} status - Status a ser normalizado
 * @returns {string} Status normalizado
 */
const normalizeStatus = (status) => {
    return String(status || "").toLowerCase().trim();
};

/**
 * Remove espaços extras e trim
 * @param {string} str - String a ser limpa
 * @returns {string} String sem espaços extras
 */
const cleanWhitespace = (str) => {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
};

module.exports = {
    capitalizeWords,
    capitalizeFirst,
    normalizeForSearch,
    normalizeStatus,
    cleanWhitespace
};
