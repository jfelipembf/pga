/**
 * Date utilities - Re-exports from @pga/shared with convenience helpers
 * 
 * Este arquivo facilita o uso das funções de data centralizadas.
 * USE ESTAS FUNÇÕES em vez de manipular datas manualmente!
 */

// Force explicit import to bypass potential caching issues
import { formatDateDisplay as sharedFormatDateDisplay, parseDate } from "@pga/shared";

// Re-export principais funções do shared
export {
    toISODate,           // Date -> "YYYY-MM-DD"
    toMonthKey,          // "YYYY-MM-DD" -> "YYYY-MM"
    monthRangeFromKey,   // "YYYY-MM" -> { start, end }
    formatDate,          // Date/Timestamp -> "DD-MM-YYYY"
    parseDate,           // "YYYY-MM-DD" -> Date
    parseFirestoreDate,  // Firestore Timestamp -> Date
    sanitizeDate,        // Any -> "YYYY-MM-DD" ou null
    addDays,             // (date, days) -> Date
    getToday,            // () -> Date (midnight)
    normalizeDate,       // Date -> Date (midnight)
    getTodayISO,         // () -> "YYYY-MM-DD"
    getThisMonth,        // () -> "YYYY-MM"
    getYesterdayISO,     // () -> "YYYY-MM-DD"
} from "@pga/shared"



export const formatDateDisplay = (date, options = {}) => {
    if (typeof sharedFormatDateDisplay === 'function') {
        return sharedFormatDateDisplay(date, options);
    }
    // Fallback implementation if shared version is missing
    const parsed = parseDate(date);
    if (!parsed) return "";
    return parsed.toLocaleDateString("pt-BR", options);
};
