import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

/**
 * Utilitários de Data Padrão do Sistema
 * Centraliza a formatação de datas usando Moment.js (padrão do projeto) ou Intl.
 */

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY).
 * Aceita Date object, Timestamp do Firestore ou string ISO.
 * @param {any} date - Data a ser formatada
 * @returns {string} Data formatada ou '-'
 */
export const formatDate = (date, format = 'date') => {
    if (!date) return '-';

    // Tratamento para Timestamp do Firestore (seconds, nanoseconds)
    const m = date.seconds ? moment(date.seconds * 1000) : moment(date);

    if (format === 'time') return m.format('HH:mm');
    if (format === 'datetime' || format === 'full') return m.format('DD/MM/YYYY HH:mm');
    if (format === 'date') return m.format('DD/MM/YYYY');

    // Se o formato não for uma keyword conhecida, usa como string de formatação do Moment
    return m.format(format);
};

/**
 * Formata uma data para o padrão de data e hora (DD/MM/YYYY HH:mm).
 * @param {any} date - Data a ser formatada
 * @returns {string} Data e hora formatadas
 */
export const formatDateTime = (date) => {
    if (!date) return '-';

    if (date.seconds) {
        return moment(date.seconds * 1000).format('DD/MM/YYYY HH:mm');
    }

    return moment(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Retorna uma descrição relativa do tempo (ex: "há 2 horas").
 * @param {any} date - Data
 * @returns {string} Tempo relativo
 */
export const formatRelative = (date) => {
    if (!date) return '-';
    if (date.seconds) {
        return moment(date.seconds * 1000).fromNow();
    }
    return moment(date).fromNow();
};

/**
 * Converte data para formato ISO (YYYY-MM-DD) útil para inputs type="date".
 * @param {any} date 
 * @returns {string} 
 */
export const toISODate = (date) => {
    if (!date) return '';
    if (date.seconds) return moment(date.seconds * 1000).format('YYYY-MM-DD');
    return moment(date).format('YYYY-MM-DD');
}

/**
 * Normaliza qualquer entrada (String, Timestamp, Date) para um objeto Date real (JS).
 * Fundamental para garantir que o Firebase salve como Timestamp e não como String.
 * @param {any} date 
 * @returns {Date | null}
 */
export const normalizeDate = (date) => {
    if (!date) return null;

    // Se for um objeto do Moment.js
    if (moment.isMoment(date)) return date.toDate();

    // Se for um Date do JS
    if (date instanceof Date) return date;

    // Se for um Timestamp do Firestore (.seconds deve ser número)
    if (date && typeof date.seconds === 'number') return new Date(date.seconds * 1000);

    // Se for uma string (comum vir de inputs HTML como YYYY-MM-DD)
    if (typeof date === 'string') {
        // Tentativa de evitar distorção de fuso horário (UTC vs Local) em strings curtas
        if (date.length === 10) {
            return moment(date + 'T12:00:00').toDate();
        }
        return moment(date).toDate();
    }

    // Fallback using moment
    const m = moment(date);
    return m.isValid() ? m.toDate() : null;
};

/**
 * Formata uma data usando Intl.DateTimeFormat para exibição com opções flexíveis.
 * @param {any} date - Data a ser formatada
 * @param {object} options - Opções do Intl.DateTimeFormat
 * @returns {string} Data formatada
 */
export const formatDateDisplay = (date, options = {}) => {
    if (!date) return '-';

    // Normalizar a data primeiro
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return '-';

    // Opções padrão
    const defaultOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options
    };

    try {
        return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(normalizedDate);
    } catch (error) {
        console.error('Error formatting date:', error);
        return formatDate(date);
    }
};

// ============================================================================
// Funcionalidades migradas de sharedUtils.js (Centralização)
// ============================================================================

/**
 * Converte string de hora (HH:mm) para minutos totais.
 * @param {string} timeString 
 * @returns {number}
 */
export const timeToMinutes = (timeString) => {
    if (!timeString) return 0
    const [hours, minutes] = timeString.split(':').map(Number)
    return (hours * 60) + (minutes || 0)
}

/**
 * Converte minutos totais para string de hora (HH:mm).
 * @param {number} minutes 
 * @returns {string}
 */
export const minutesToTime = (minutes) => {
    if (!minutes && minutes !== 0) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export const addDays = (date, days) => {
    return moment(date).add(days, 'days').toDate()
}

/**
 * Parses generic ISO string to Date object
 * (Wrapper for normalizeDate, kept for compatibility if needed or alias)
 */
export const parseISO = (dateString) => {
    return normalizeDate(dateString)
}

/**
 * Alias for formatDate to support custom format string directly
 * (Since formatDate now supports custom patterns)
 */
export const format = (date, formatString) => {
    return formatDate(date, formatString)
}

export const getDay = (date) => {
    return moment(date).day()
}

export const isSameDay = (date1, date2) => {
    return moment(date1).isSame(moment(date2), 'day')
}

// Retorna sempre o Domingo anterior (ou o próprio dia se for domingo), independente do locale.
export const getStartOfWeek = (date) => {
    const m = moment(date)
    const day = m.day() // 0 = Domingo, 1 = Segunda...
    return m.clone().subtract(day, 'days').startOf('day').toDate()
}

// Deprecated alias for normalizeDate (from sharedUtils)
export const parseFirestoreDate = normalizeDate;

export const getStepForView = (view) => {
    switch (view) {
        case 'day': return 1
        case 'week': return 7
        case 'month': return 30
        default: return 7
    }
}

export const formatRangeLabel = (startDate, endDate, view) => {
    // Ensure inputs are parsed correctly whether they are Dates or strings
    const start = moment(startDate instanceof Date ? startDate : String(startDate))
    const end = moment(endDate instanceof Date ? endDate : String(endDate))

    if (!start.isValid() || !end.isValid()) return ''

    if (view === 'day') {
        return start.format('DD/MM/YYYY')
    }

    if (view === 'week') {
        return `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`
    }

    return `${start.format('MMM/YYYY')}`
}

export const formatDayHeaderLabel = (date) => {
    return moment(date).format('ddd DD/MM')
}
