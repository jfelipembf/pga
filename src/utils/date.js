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
export const formatDate = (date) => {
    if (!date) return '-';

    // Tratamento para Timestamp do Firestore (seconds, nanoseconds)
    if (date.seconds) {
        return moment(date.seconds * 1000).format('DD/MM/YYYY');
    }

    return moment(date).format('DD/MM/YYYY');
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
