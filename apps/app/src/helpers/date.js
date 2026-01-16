export const formatDate = value => {
  if (!value) return "--"
  // Handle Firestore Timestamp objects first
  const parsed = parseFirestoreDate(value)
  if (!parsed) return value
  const pad = n => String(n).padStart(2, "0")
  return `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${parsed.getFullYear()}`
}

/**
 * Converte string de data (YYYY-MM-DD) para objeto Date
 * Trata YYYY-MM-DD como data local para evitar problemas de fuso horário
 */
export const parseDate = (dateString) => {
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

/**
 * Converte objeto Date para string (YYYY-MM-DD)
 */
export const formatDateString = (date) => {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

/**
 * Zera a hora de um objeto Date para comparar apenas datas
 */
export const normalizeDate = (date) => {
  if (!date) return null
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/**
 * Retorna data atual zerada (apenas data, sem hora)
 */
export const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Compara duas datas ignorando horas
 * Retorna: -1 (data1 < data2), 0 (igual), 1 (data1 > data2)
 */
export const compareDates = (date1, date2) => {
  const d1 = normalizeDate(date1)
  const d2 = normalizeDate(date2)
  
  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

/**
 * Verifica se data1 é anterior a data2 (ignorando horas)
 */
export const isDateBefore = (date1, date2) => {
  return compareDates(date1, date2) === -1
}

/**
 * Verifica se data1 é posterior ou igual a data2 (ignorando horas)
 */
export const isDateAfterOrEqual = (date1, date2) => {
  return compareDates(date1, date2) >= 0
}

export const parseFirestoreDate = value => {
  if (!value) return null
  if (typeof value?.toDate === "function") return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === "string") return parseDate(value)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export default formatDate
