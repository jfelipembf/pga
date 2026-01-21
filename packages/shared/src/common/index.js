const { format } = require("date-fns");
const { ptBR } = require("date-fns/locale");

// Import new utility modules
const { formatCurrency, formatCurrencyAbs } = require("./currency");
const {
    capitalizeWords,
    capitalizeFirst,
    normalizeForSearch,
    normalizeStatus,
    cleanWhitespace
} = require("./string");
const {
    calculatePercent,
    calculateDelta,
    calculateAverage,
    formatNumber
} = require("./math");

const deriveFullName = (data) => {
    const { firstName, lastName, name } = data;
    return (name || [firstName, lastName].filter(Boolean).join(" ").trim()) || "";
};

// ============================================================================
// DATE UTILITIES - Single Source of Truth
// ============================================================================

/**
 * Converts a date to ISO format (YYYY-MM-DD)
 * @param {Date|string|null} date - Date to convert
 * @returns {string|null} - YYYY-MM-DD string or null
 */
const toISODate = (date) => {
    if (!date) return null;

    if (typeof date === "string") {
        const parts = date.split("T")[0].split(" ")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
            return parts;
        }
    }

    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;

    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

/**
 * Parses a date string (YYYY-MM-DD) to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} - Date object or null
 */
const parseDate = (dateString) => {
    if (!dateString) return null;

    if (dateString instanceof Date) return dateString;

    if (typeof dateString === 'string') {
        const ymdMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (ymdMatch) {
            const [, year, month, day] = ymdMatch;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
    }

    return new Date(dateString);
};

/**
 * Parses Firestore Timestamp or any date value to Date object
 * @param {any} value - Firestore Timestamp, Date, or string
 * @returns {Date|null} - Date object or null
 */
const parseFirestoreDate = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === "string") return parseDate(value);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date to display format (DD-MM-YYYY)
 * @param {any} value - Date value
 * @returns {string} - Formatted date or "--"
 */
const formatDate = (value) => {
    if (!value) return "--";
    const parsed = parseFirestoreDate(value);
    if (!parsed) return "--";
    const pad = n => String(n).padStart(2, "0");
    return `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${parsed.getFullYear()}`;
};

/**
 * Sanitizes a date value to YYYY-MM-DD format
 * @param {string|Date|null} val - Date value to sanitize
 * @returns {string|null} - YYYY-MM-DD string or null
 */
const sanitizeDate = (val) => {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "string") {
        return val.split("T")[0];
    }
    if (val instanceof Date) {
        return toISODate(val);
    }
    return null;
};

/**
 * Adds days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

/**
 * Returns today's date at midnight (local time)
 * @returns {Date}
 */
const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Normalizes a date to midnight (removes time component)
 * @param {Date|string} date - Date to normalize
 * @returns {Date|null} - Normalized date or null
 */
const normalizeDate = (date) => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

/**
 * Compares two dates (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
const compareDates = (date1, date2) => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
};

/**
 * Checks if date1 is before date2 (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean}
 */
const isDateBefore = (date1, date2) => compareDates(date1, date2) === -1;

/**
 * Checks if date1 is after or equal to date2 (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean}
 */
const isDateAfterOrEqual = (date1, date2) => compareDates(date1, date2) >= 0;

/**
 * Checks if two dates are the same day (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean}
 */
const isSameDay = (date1, date2) => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() === d2.getTime();
};

/**
 * Converts date to month key (YYYY-MM)
 * @param {string} isoDate - Date in YYYY-MM-DD format
 * @returns {string|null} - Month key or null
 */
const toMonthKey = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return null;
    if (isoDate.length < 7) return null;
    return isoDate.slice(0, 7);
};

/**
 * Returns date range for a month
 * @param {string} monthKey - Month key (YYYY-MM)
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
 * Finds first occurrence of a weekday on or after a date
 * @param {string} startDateStr - Start date (YYYY-MM-DD)
 * @param {number} weekday - Weekday (0=Sunday, 6=Saturday)
 * @returns {Date}
 */
const findFirstWeekdayOnOrAfter = (startDateStr, weekday) => {
    const start = new Date(startDateStr);
    const target = Number(weekday);

    for (let i = 0; i < 7; i++) {
        const candidate = addDays(start, i);
        if (candidate.getDay() === target) return candidate;
    }
    return start;
};

/**
 * Calculates end time based on start time and duration
 * @param {string} start - Start time (HH:mm)
 * @param {number} minutes - Duration in minutes
 * @returns {string} - End time (HH:mm)
 */
const computeEndTime = (start, minutes) => {
    if (!start || !minutes) return "";
    const [h, m] = start.split(":").map(Number);
    const date = new Date(0, 0, 0, h, m + Number(minutes));
    return date.toTimeString().slice(0, 5);
};

/**
 * Gets start of week (Sunday)
 * @param {Date|string} date - Reference date
 * @returns {Date}
 */
const getStartOfWeekSunday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    return addDays(d, -day);
};

/**
 * Converts time string to minutes
 * @param {string} hhmm - Time in HH:mm format
 * @returns {number} - Total minutes
 */
const timeToMinutes = (hhmm) => {
    const parts = String(hhmm || "").split(":");
    if (parts.length !== 2) return NaN;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
};

/**
 * Converts minutes to time string
 * @param {number} totalMinutes - Total minutes
 * @returns {string} - Time in HH:mm format
 */
const minutesToTime = (totalMinutes) => {
    const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const pad = n => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}`;
};

// ============================================================================
// VIEW & FORMAT UTILITIES
// ============================================================================

/**
 * Returns step size in days for a given view
 * @param {string} view - 'week' or 'day'
 * @returns {number}
 */
const getStepForView = (view) => {
    switch (view) {
        case "week": return 7;
        case "day": return 1;
        default: return 1;
    }
};

/**
 * Formats a date range label for the navigator
 * @param {Date} date - Reference date
 * @param {string} view - 'week' or 'day'
 * @returns {string}
 */
const formatRangeLabel = (date, view) => {
    const start = normalizeDate(date);
    if (view === "day") {
        return format(start, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    if (view === "week") {
        const sunday = getStartOfWeekSunday(start);
        const saturday = addDays(sunday, 6);
        const startFmt = format(sunday, "d 'de' MMM", { locale: ptBR });
        const endFmt = format(saturday, "d 'de' MMM", { locale: ptBR });
        return `${startFmt} - ${endFmt}`;
    }
    return formatDate(start);
};

/**
 * Formats a day label (e.g. "Segunda-feira")
 * @param {Date} date 
 * @returns {string}
 */
const formatDayLabel = (date) => {
    return format(new Date(date), "EEEE", { locale: ptBR });
};

/**
 * Formats a day header label (e.g. "10 - Seg")
 * @param {Date} date 
 * @returns {string}
 */
const formatDayHeaderLabel = (date) => {
    return format(new Date(date), "d - EEE", { locale: ptBR });
};

/**
 * Formats a date for display with locale options (default pt-BR)
 * @param {Date|string|number} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string}
 */
const formatDateDisplay = (date, options = {}) => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return parsed.toLocaleDateString("pt-BR", options);
};

/**
 * Returns today's date in ISO format (YYYY-MM-DD)
 * @returns {string} - Today's date
 */
const getTodayISO = () => toISODate(new Date());

/**
 * Returns the current month in YYYY-MM format
 * @returns {string} - Current month
 */
const getThisMonth = () => toMonthKey(toISODate(new Date()));

/**
 * Returns yesterday's date in ISO format (YYYY-MM-DD)
 * @returns {string} - Yesterday's date
 */
const getYesterdayISO = () => {
    const yesterday = addDays(new Date(), -1);
    return toISODate(yesterday);
};

module.exports = {
    deriveFullName,

    // Currency utilities (NEW!)
    formatCurrency,
    formatCurrencyAbs,

    // String utilities (NEW!)
    capitalizeWords,
    capitalizeFirst,
    normalizeForSearch,
    normalizeStatus,
    cleanWhitespace,

    // Math utilities (NEW!)
    calculatePercent,
    calculateDelta,
    calculateAverage,
    formatNumber,

    // Core date functions
    toISODate,
    parseDate,
    parseFirestoreDate,
    formatDate,
    formatDateDisplay,
    sanitizeDate,
    getTodayISO,
    getThisMonth,
    getYesterdayISO,

    // Date manipulation
    addDays,
    getToday,
    normalizeDate,

    // Date comparison
    compareDates,
    isDateBefore,
    isDateAfterOrEqual,
    isSameDay,

    // Date utilities
    toMonthKey,
    monthRangeFromKey,
    findFirstWeekdayOnOrAfter,
    computeEndTime,
    getStartOfWeekSunday,

    // Time utilities
    timeToMinutes,
    minutesToTime,

    // View & Format utilities
    getStepForView,
    formatRangeLabel,
    formatDayLabel,
    formatDayHeaderLabel
};
