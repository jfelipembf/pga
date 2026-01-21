/**
 * Date utilities - Re-exports from @pga/shared with convenience helpers
 * 
 * Este arquivo facilita o uso das funções de data centralizadas.
 * USE ESTAS FUNÇÕES em vez de manipular datas manualmente!
 */

// Re-export principais funções do shared
export {
    toISODate,           // Date -> "YYYY-MM-DD"
    toMonthKey,          // "YYYY-MM-DD" -> "YYYY-MM"
    monthRangeFromKey,   // "YYYY-MM" -> { start, end }
    formatDate,          // Date/Timestamp -> "DD-MM-YYYY"
    formatDateDisplay,   // Date/Timestamp -> "DD/MM/YYYY" (locale based)
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
