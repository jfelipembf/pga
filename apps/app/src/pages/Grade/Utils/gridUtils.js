import { GRID_END_MINUTES, GRID_START_MINUTES, isMinutesInTurn } from "../Constants"
import { timeToMinutes, toISODate, parseFirestoreDate } from "@pga/shared"

export const isWithinTurn = (turn, startTime) => {
  const m = timeToMinutes(startTime)
  if (!Number.isFinite(m)) return false
  return isMinutesInTurn(turn, m)
}

export const occursOnDate = (schedule, isoDate, dayIndex) => {
  const sessionDate = schedule?.sessionDate || schedule?.activityDate || null
  if (sessionDate) {
    // Use centralized parser to handle Timestamp, Date, or String correctly (Local Time)
    const normalizedSession = toISODate(parseFirestoreDate(sessionDate))
    const normalizedIso = String(isoDate).slice(0, 10)
    return normalizedSession === normalizedIso
  }

  const weekDays = Array.isArray(schedule?.weekDays) ? schedule.weekDays : []
  if (!weekDays.includes(dayIndex)) return false

  const startDate = schedule?.startDate || null
  const endDate = schedule?.endDate || null

  if (startDate && String(isoDate) < String(startDate)) return false
  if (endDate && String(isoDate) > String(endDate)) return false

  return true
}

export const getEventColor = (schedule, activitiesById = {}) => {
  const activityId = schedule?.idActivity ? String(schedule.idActivity) : ""
  const activityColor = activityId ? activitiesById?.[activityId]?.color : null
  if (activityColor) return String(activityColor)

  const fallback = schedule?.color || schedule?.colorHex || schedule?.borderColor || null
  return fallback ? String(fallback) : null
}

export const buildVisibleMinutes = (turn, schedules) => {
  const base = new Set()
  for (let m = GRID_START_MINUTES; m <= GRID_END_MINUTES; m += 60) {
    if (isMinutesInTurn(turn, m)) base.add(m)
  }

  const visibleScheduleTimes = (Array.isArray(schedules) ? schedules : [])
    .map(s => String(s?.startTime || ""))
    .filter(Boolean)
    .filter(t => isWithinTurn(turn, t))

  visibleScheduleTimes.forEach(t => {
    const mins = timeToMinutes(t)
    if (Number.isFinite(mins) && isMinutesInTurn(turn, mins)) base.add(mins)
  })

  return Array.from(base).sort((a, b) => a - b)
}

export const sortClassesByCreated = classes =>
  (classes || []).slice().sort((a, b) => {
    const ta = a?.createdAt?.seconds || 0
    const tb = b?.createdAt?.seconds || 0
    if (ta !== tb) return ta - tb
    const taNanos = a?.createdAt?.nanoseconds || 0
    const tbNanos = b?.createdAt?.nanoseconds || 0
    if (taNanos !== tbNanos) return taNanos - tbNanos
    const na = (a?.name || "").toLowerCase()
    const nb = (b?.name || "").toLowerCase()
    if (na && nb && na !== nb) return na.localeCompare(nb)
    const ia = a?.id || ""
    const ib = b?.id || ""
    return ia.localeCompare(ib)
  })

export const buildClassOrderMap = classes => {
  const map = new Map()
    ; (classes || []).forEach((c, idx) => map.set(c.id, idx))
  return map
}

export const sortSessionsWithClassOrder = (sessions, classOrderMap = new Map()) =>
  (sessions || []).slice().sort((a, b) => {
    const sa = a.startTime || ""
    const sb = b.startTime || ""
    if (sa !== sb) return sa.localeCompare(sb)

    const oa = classOrderMap.get(a.idClass || a.idActivity) ?? Number.MAX_SAFE_INTEGER
    const ob = classOrderMap.get(b.idClass || b.idActivity) ?? Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob

    const da = a.sessionDate || ""
    const db = b.sessionDate || ""
    if (da && db && da !== db) return da < db ? -1 : 1

    const ca = a?.createdAt?.seconds || 0
    const cb = b?.createdAt?.seconds || 0
    if (ca !== cb) return ca - cb
    const can = a?.createdAt?.nanoseconds || 0
    const cbn = b?.createdAt?.nanoseconds || 0
    if (can !== cbn) return can - cbn
    const ida = a?.idSession || a?.id || ""
    const idb = b?.idSession || b?.id || ""
    return ida.localeCompare(idb)
  })

