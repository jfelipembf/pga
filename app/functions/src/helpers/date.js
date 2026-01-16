const { Timestamp } = require("firebase-admin/firestore");

/**
 * Converte string de data (YYYY-MM-DD) para objeto Date
 * Trata YYYY-MM-DD como data local para evitar problemas de fuso horário
 */
const parseDate = (dateString) => {
    if (!dateString) return null

    // Se for formato YYYY-MM-DD, tratar como data local
    const ymdMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (ymdMatch) {
        const [, year, month, day] = ymdMatch
        return new Date(Number(year), Number(month) - 1, Number(day))
    }

    // Para outros formatos, usar constructor padrão
    return new Date(dateString)
}

const parseFirestoreDate = value => {
    if (!value) return null
    if (typeof value?.toDate === "function") return value.toDate()
    if (value instanceof Date) return value
    if (typeof value === "string") return parseDate(value)
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

const formatDate = value => {
    if (!value) return "--"
    // Handle Firestore Timestamp objects first
    const parsed = parseFirestoreDate(value)
    if (!parsed) return value
    const pad = n => String(n).padStart(2, "0")
    return `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${parsed.getFullYear()}`
}

/**
 * Adiciona dias a uma data.
 * @param {Date|string} date 
 * @param {number} days 
 * @returns {Date}
 */
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

/**
 * Converte data para string ISO (YYYY-MM-DD).
 * @param {Date|string} date 
 * @returns {string|null}
 */
const toISODate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
};

/**
 * Encontra a primeira ocorrência de um dia da semana na ou após a data inicial.
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {number} weekday - 0 (Domingo) a 6 (Sábado)
 * @returns {Date}
 */
const findFirstWeekdayOnOrAfter = (startDateStr, weekday) => {
    const start = new Date(startDateStr);
    const target = Number(weekday);

    for (let i = 0; i < 7; i += 1) {
        const candidate = addDays(start, i);
        if (candidate.getDay() === target) return candidate;
    }
    return start;
};

/**
 * Calcula o horário de término baseado no início e duração em minutos.
 * @param {string} start - HH:mm
 * @param {number} minutes 
 * @returns {string} HH:mm
 */
const computeEndTime = (start, minutes) => {
    if (!start || !minutes) return "";
    const [h, m] = start.split(":").map(Number);
    const date = new Date(0, 0, 0, h, m + Number(minutes));
    return date.toTimeString().slice(0, 5);
};

/**
 * Converte data ISO para chave de mês (YYYY-MM).
 * @param {string} isoDate - Data formato YYYY-MM-DD.
 * @returns {string|null} - Chave do mês ou null.
 */
const toMonthKey = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return null;
    if (isoDate.length < 7) return null;
    return isoDate.slice(0, 7);
};

/**
 * Retorna o range de datas (início e fim) para um mês.
 * @param {string} monthKey - Chave do mês (YYYY-MM).
 * @returns {{start: string, end: string}|null}
 */
const monthRangeFromKey = (monthKey) => {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
    const start = `${monthKey}-01`;
    const [y, m] = monthKey.split("-").map(Number);
    const endDate = new Date(Date.UTC(y, m, 0));
    const end = endDate.toISOString().slice(0, 10);
    return { start, end };
};

/**
 * Retorna objeto Date para hoje (meia-noite local)
 * @returns {Date}
 */
const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

module.exports = {
    formatDate,
    parseDate,
    parseFirestoreDate,
    toISODate,
    normalizeDate: toISODate,
    getToday,
    addDays,
    findFirstWeekdayOnOrAfter,
    computeEndTime,
    toMonthKey,
    monthRangeFromKey,
};



