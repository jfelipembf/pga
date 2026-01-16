import { GRID_END_MINUTES, GRID_START_MINUTES, isMinutesInTurn } from "../Constants"
import { timeToMinutes } from "./dateUtils"

export const isWithinTurn = (turn, startTime) => {
  const m = timeToMinutes(startTime)
  if (!Number.isFinite(m)) return false
  return isMinutesInTurn(turn, m)
}

export const occursOnDate = (schedule, isoDate, dayIndex) => {
  const sessionDate = schedule?.sessionDate || schedule?.activityDate || null
  if (sessionDate) {
    return String(sessionDate).slice(0, 10) === String(isoDate)
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
