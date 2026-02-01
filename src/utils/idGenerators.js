/**
 * Utilitários para gerar IDs amigáveis (human-readable)
 * 
 * Formatos:
 * - Venda: #V20250131-001
 * - Receivable: #R20250131-001
 * - Expense: #D20250131-001
 */

/**
 * Gera um número de venda amigável baseado na data e sequencial
 * @param {Date} date - Data da venda
 * @param {number} sequentialNumber - Número sequencial do dia (1, 2, 3...)
 * @returns {string} Exemplo: "V20250131-001"
 */
export const generateSaleNumber = (date = new Date(), sequentialNumber = 1) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequentialNumber).padStart(3, '0');

    return `V${year}${month}${day}-${seq}`;
};

/**
 * Gera um número de recebível amigável
 * @param {Date} date - Data do recebível
 * @param {number} sequentialNumber - Número sequencial
 * @returns {string} Exemplo: "R20250131-001"
 */
export const generateReceivableNumber = (date = new Date(), sequentialNumber = 1) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequentialNumber).padStart(3, '0');

    return `R${year}${month}${day}-${seq}`;
};

/**
 * Gera um número de despesa amigável
 * @param {Date} date - Data da despesa
 * @param {number} sequentialNumber - Número sequencial
 * @returns {string} Exemplo: "D20250131-001"
 */
export const generateExpenseNumber = (date = new Date(), sequentialNumber = 1) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequentialNumber).padStart(3, '0');

    return `D${year}${month}${day}-${seq}`;
};

/**
 * Gera um código curto a partir de um ID Firebase (fallback)
 * @param {string} firebaseId - ID do Firebase
 * @returns {string} Exemplo: "#ABC123"
 */
export const generateShortCode = (firebaseId) => {
    if (!firebaseId) return '#------';

    // Pega os primeiros 6 caracteres e converte para uppercase
    const short = firebaseId.substring(0, 6).toUpperCase();
    return `#${short}`;
};

/**
 * Formata um número de venda para exibição
 * @param {string} saleNumber - Número da venda (V20250131-001)
 * @returns {string} Exemplo: "#V20250131-001"
 */
export const formatSaleNumber = (saleNumber) => {
    if (!saleNumber) return '-';
    return `#${saleNumber}`;
};

/**
 * Extrai a data de um número de venda
 * @param {string} saleNumber - Número da venda (V20250131-001)
 * @returns {Date|null}
 */
export const extractDateFromSaleNumber = (saleNumber) => {
    if (!saleNumber || saleNumber.length < 9) return null;

    try {
        const dateStr = saleNumber.substring(1, 9); // Remove 'V' e pega YYYYMMDD
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);

        return new Date(year, parseInt(month) - 1, day);
    } catch (error) {
        return null;
    }
};

/**
 * Gera um número sequencial do dia baseado no timestamp
 * Para evitar colisões, usa HHmmss como sequencial
 * @param {Date} date - Data/hora atual
 * @returns {number}
 */
export const generateDailySequential = (date = new Date()) => {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    // Retorna como número: HHMMSS (ex: 143025 = 14:30:25)
    return parseInt(`${hour}${minute}${second}`);
};
