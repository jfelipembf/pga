import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns"
import ptBR from "date-fns/locale/pt-BR"

const isPresentStatus = (status) => {
  // Compat:
  // - attendance: "present" | "absent" | "late" | "justified"
  // - legacy numeric: 0 = presente
  if (status === null || status === undefined) return false
  const n = Number(status)
  if (!Number.isNaN(n)) return n === 0
  const s = String(status).toLowerCase()
  return s === "present"
}

/**
 * Calcula presenças previstas vs realizadas para um mês e comparação com mês anterior
 * @param {Array} presences - Array de presenças com activityDate e status
 * @param {Date} referenceDate - Data de referência (padrão: hoje)
 * @returns {Object} { current, previous, comparison }
 */
export function calculatePresenceStats(presences = [], referenceDate = new Date()) {
  const current = calculateMonthStats(presences, referenceDate)
  const previous = calculateMonthStats(presences, subMonths(referenceDate, 1))
  const comparison = {
    attended: current.attended - previous.attended,
    attendedPercent: previous.attended > 0
      ? ((current.attended - previous.attended) / previous.attended) * 100
      : 0,
    frequency: current.frequency - previous.frequency,
  }

  return { current, previous, comparison }
}

export function calculateClientPresenceCardStats({ presences = [], enrollments = [] } = {}, referenceDate = new Date()) {
  const currentMonth = calculateMonthStats(presences, referenceDate)
  const previousMonth = calculateMonthStats(presences, subMonths(referenceDate, 1))

  // Agora usamos o 'expected' retornado pelo calculateMonthStats, que considera apenas
  // registros efetivos (presente/falta), ignorando a projeção teórica de matrículas.
  const current = {
    ...currentMonth,
    // expected já vem correto de currentMonth
    // frequency já vem correto de currentMonth
  }

  const previous = {
    ...previousMonth,
    // expected já vem correto de previousMonth
    // frequency já vem correto de previousMonth
  }

  const comparison = {
    attended: current.attended - previous.attended,
    expected: current.expected - previous.expected,
    frequency: current.frequency - previous.frequency,
  }

  return { current, previous, comparison }
}

/**
 * Calcula estatísticas de presença para um mês específico
 * @param {Array} presences 
 * @param {Date} monthDate 
 * @returns {Object} { expected, attended, frequency, monthLabel }
 */
function calculateMonthStats(presences, monthDate) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)

  // Filtra presenças do mês
  const monthPresences = presences.filter(p => {
    const date = new Date(p.activityDate || p.sessionDate || p.date)
    return !isNaN(date) && isWithinInterval(date, { start: monthStart, end: monthEnd })
  })

  // Considera apenas registros efetivos (presente/falta/justificado) para o cálculo
  // Ignora agendamentos futuros ou sem status
  const effectiveDetails = monthPresences.filter(p => {
    const s = (p.status || "").toLowerCase()
    return ["present", "absent", "late", "justified", "0", "1"].includes(s)
  })

  // Presenças realizadas (status === 0 ou "present")
  const attended = effectiveDetails.filter(p => isPresentStatus(p.status)).length

  // Total de registros efetivos (Presente + Falta)
  const expected = effectiveDetails.length

  // Frequência (percentual de presença)
  const frequency = expected > 0 ? (attended / expected) * 100 : 0

  // Label do mês para exibição
  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })

  return {
    expected,
    attended,
    frequency,
    monthLabel,
    monthStart,
    monthEnd,
    presences: monthPresences
  }
}

const normalizeWeekday = (weekday) => {
  if (weekday === null || weekday === undefined) return null
  const n = Number(weekday)
  if (Number.isNaN(n)) return null
  if (n === 7) return 0
  if (n < 0 || n > 6) return null
  return n
}

const parseDateSafe = (value) => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

const maxDate = (a, b) => (a.getTime() >= b.getTime() ? a : b)
const minDate = (a, b) => (a.getTime() <= b.getTime() ? a : b)

export function countWeekdayOccurrencesInRange(rangeStart, rangeEnd, weekday) {
  const wd = normalizeWeekday(weekday)
  if (wd === null) return 0
  if (!rangeStart || !rangeEnd) return 0
  if (rangeStart.getTime() > rangeEnd.getTime()) return 0

  const start = new Date(rangeStart)
  const end = new Date(rangeEnd)

  const startDow = start.getDay()
  const delta = (wd - startDow + 7) % 7
  const first = new Date(start)
  first.setDate(first.getDate() + delta)

  if (first.getTime() > end.getTime()) return 0
  const diffDays = Math.floor((end.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
  return 1 + Math.floor(diffDays / 7)
}

export function calculateExpectedAttendancesFromEnrollments(enrollments = [], referenceDate = new Date()) {
  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)

  const list = Array.isArray(enrollments) ? enrollments : []
  const recurringActive = list.filter(e => (e?.type || "").toLowerCase() === "recurring" && (e?.status || "").toLowerCase() === "active")

  let expected = 0
  for (const e of recurringActive) {
    const weekday = normalizeWeekday(e?.weekday)
    if (weekday === null) continue

    const startDate = parseDateSafe(e?.startDate) || monthStart
    const endDate = parseDateSafe(e?.endDate) || monthEnd

    const rangeStart = maxDate(monthStart, startDate)
    const rangeEnd = minDate(monthEnd, endDate)
    if (rangeStart.getTime() > rangeEnd.getTime()) continue

    expected += countWeekdayOccurrencesInRange(rangeStart, rangeEnd, weekday)
  }

  return expected
}

/**
 * Formata o valor de comparação para exibição
 * @param {number} value 
 * @returns {Object} { formatted, color, icon }
 */
export function formatComparison(value) {
  const formatted = value > 0 ? `+${Math.round(value)}` : `${Math.round(value)}`
  let color = "secondary"
  let icon = "mdi-minus"

  if (value > 0) {
    color = "success"
    icon = "mdi-trending-up"
  } else if (value < 0) {
    color = "danger"
    icon = "mdi-trending-down"
  }

  return { formatted, color, icon }
}
