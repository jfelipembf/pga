/**
 * Funções utilitárias compartilhadas
 * Substituem dependências de @pga/shared usando bibliotecas já disponíveis no projeto
 */

import moment from 'moment'
import { toISODate, normalizeDate, formatDate, formatDateTime, formatRelative } from './date'

// Re-exporta funções de data já existentes centralizadas no date.js
export { toISODate, normalizeDate, formatDate, formatDateTime, formatRelative }

// Funções de tempo
export const timeToMinutes = (timeString) => {
    if (!timeString) return 0
    const [hours, minutes] = timeString.split(':').map(Number)
    return (hours * 60) + (minutes || 0)
}

export const minutesToTime = (minutes) => {
    if (!minutes && minutes !== 0) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// Funções de data usando moment (já disponível no projeto)
export const addDays = (date, days) => {
    return moment(date).add(days, 'days').toDate()
}

export const parseISO = (dateString) => {
    return moment(dateString).toDate()
}

export const format = (date, formatString) => {
    return moment(date).format(formatString)
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

export const parseFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return null

    // Se for Timestamp do Firestore
    if (firestoreDate.seconds) {
        return new Date(firestoreDate.seconds * 1000)
    }

    // Se for string ou outro formato, usa Moment para garantir Local Time
    // Evita o problema de new Date('2023-01-01') ser UTC e virar dia anterior
    return moment(firestoreDate).toDate()
}

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

// mapToGridFormat removed to avoid implicit fallbacks. 
// Data mapping should be explicit in the service layer or component hooks.

export const formatDayHeaderLabel = (date) => {
    return moment(date).format('ddd DD/MM')
}
