import { getClientContracts, getClientEnrollments } from "../../services/Clients/index"
import { getToday, normalizeDate, parseFirestoreDate, toISODate, parseDate, addDays, getStartOfWeekSunday } from "@pga/shared"
import { WEEKDAY_SHORT_LABELS } from "../../constants/weekdays"


// dayNames replaced by WEEKDAY_SHORT_LABELS from constants
const normalizeStatus = status => String(status || "").toLowerCase()
const isActiveStatus = status => {
  const normalized = normalizeStatus(status)
  return normalized === "active" || normalized === "ativo"
}

/**
 * Valida regras para matrícula de um cliente em sessões/turmas selecionadas.
 */
export const validateEnrollmentRules = async ({ clientId, sessions = [], enrollmentType = 'regular' }) => {
  if (!clientId) return { ok: false, message: "Cliente não identificado." }

  // Aulas experimentais não exigem contrato ativo
  if (enrollmentType === 'experimental') {
    return { ok: true }
  }

  const contracts = await getClientContracts(clientId)
  if (!contracts?.length) {
    return { ok: false, message: "Cliente não possui contrato cadastrado." }
  }

  const today = getToday()
  const activeContracts = contracts
    .filter(ct => isActiveStatus(ct.status))
    .map(ct => {
      const startDate = normalizeDate(parseFirestoreDate(ct.startDate))
      const endDate = normalizeDate(parseFirestoreDate(ct.endDate))
      return { ct, startDate, endDate }
    })

  if (!activeContracts.length) {
    return { ok: false, message: "Cliente não possui contrato ativo." }
  }

  const validNow = activeContracts
    .filter(({ startDate, endDate }) => {
      if (!startDate || !today) return false
      if (today < startDate) return false
      if (endDate && today > endDate) return false
      return true
    })
    .sort((a, b) => {
      const aEnd = a.endDate?.getTime?.() || 0
      const bEnd = b.endDate?.getTime?.() || 0
      return bEnd - aEnd
    })

  const chosen = validNow[0] || null
  const contract = chosen?.ct || null
  const contractStartDate = chosen?.startDate || null
  const contractEndDate = chosen?.endDate || null

  if (!contract) {
    const future = activeContracts
      .filter(({ startDate }) => startDate && today && today < startDate)
      .sort((a, b) => (a.startDate?.getTime?.() || 0) - (b.startDate?.getTime?.() || 0))
    if (future.length) {
      return {
        ok: false,
        message: `Contrato só é válido a partir de ${toISODate(future[0].startDate)}.`,
      }
    }

    const past = activeContracts
      .filter(({ endDate }) => endDate && today && today > endDate)
      .sort((a, b) => (b.endDate?.getTime?.() || 0) - (a.endDate?.getTime?.() || 0))
    if (past.length) {
      return {
        ok: false,
        message: `Contrato expirou em ${toISODate(past[0].endDate)}.`,
      }
    }

    return { ok: false, message: "Cliente não possui contrato ativo." }
  }

  const allowedDays = Array.isArray(contract.allowedWeekDays)
    ? contract.allowedWeekDays.map(Number)
    : null

  const getDayFromSession = (s) => {
    // 1. Prefer derived from sessionDate (visual truth)
    if (s.sessionDate) {
      const d = parseDate(s.sessionDate)
      if (d && !Number.isNaN(d.getTime())) return d.getDay()
    }
    // 2. Fallback to stored weekday property
    if (s.weekday !== null && s.weekday !== undefined) return Number(s.weekday)
    return null
  }

  const weekdays = Array.from(
    new Set(
      sessions
        .map(getDayFromSession)
        .filter(w => w !== null && w !== undefined && Number.isFinite(w))
    )
  )

  if (allowedDays && allowedDays.length > 0 && weekdays.some(day => !allowedDays.includes(day))) {
    const allowedDayNames = allowedDays.map(d => WEEKDAY_SHORT_LABELS[d]).join(", ")
    const invalidDayNames = weekdays
      .filter(day => !allowedDays.includes(day))
      .map(d => WEEKDAY_SHORT_LABELS[d])
      .join(", ")
    return {
      ok: false,
      message: `Contrato permite matrícula apenas nos dias: ${allowedDayNames}. Dias selecionados não permitidos: ${invalidDayNames}.`,
    }
  }

  const maxPerWeek = Number(contract.maxWeeklyEnrollments || 0)

  if (maxPerWeek > 0) {
    const todayWeekStart = getStartOfWeekSunday(getToday())
    const todayWeekEnd = addDays(todayWeekStart, 6)

    let existingEnrollments = []
    try {
      existingEnrollments = await getClientEnrollments(clientId)
    } catch (e) {
      existingEnrollments = []
    }

    const isActiveEnrollment = e => String(e?.status || "").toLowerCase() === "active"

    const existingWeekdays = new Set(
      (Array.isArray(existingEnrollments) ? existingEnrollments : [])
        .filter(isActiveEnrollment)
        .map(e => {
          const hasSession = Boolean(e?.idSession) || Boolean(e?.sessionDate)
          if (hasSession) {
            const sd = normalizeDate(parseFirestoreDate(e.sessionDate))
            if (!sd) return null
            if (sd < todayWeekStart || sd > todayWeekEnd) return null
            return sd.getDay()
          }

          const start = normalizeDate(parseFirestoreDate(e.startDate))
          const end = normalizeDate(parseFirestoreDate(e.endDate))
          const effectiveToday = (!start || !today || today >= start) && (!end || !today || today <= end)
          if (!effectiveToday) return null

          const w = e.weekday ?? null
          if (w === null || w === undefined) return null
          const wn = Number(w)
          return Number.isFinite(wn) ? wn : null
        })
        .filter(v => v !== null && v !== undefined)
    )

    const combined = new Set([...existingWeekdays, ...weekdays])

    if (combined.size > maxPerWeek) {
      return {
        ok: false,
        message: `Contrato permite até ${maxPerWeek} matrícula(s) por semana. Já existente: ${existingWeekdays.size}. Selecionado: ${weekdays.length}.`,
      }
    }
  }

  if (maxPerWeek > 0 && weekdays.length > maxPerWeek) {
    return {
      ok: false,
      message: `Contrato permite até ${maxPerWeek} matrícula(s) por semana. Selecionado: ${weekdays.length}.`,
    }
  }

  if (contractStartDate && today && today < contractStartDate) {
    return {
      ok: false,
      message: `Contrato só é válido a partir de ${toISODate(contractStartDate)}.`,
    }
  }

  if (contractEndDate && today && today > contractEndDate) {
    return {
      ok: false,
      message: `Contrato expirou em ${toISODate(contractEndDate)}.`,
    }
  }

  return { ok: true }
}
