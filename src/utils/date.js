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

    return m.format('DD/MM/YYYY');
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

    // Fallback usando moment
    const m = moment(date);
    return m.isValid() ? m.toDate() : null;
};
