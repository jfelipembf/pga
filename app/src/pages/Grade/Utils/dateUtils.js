import { normalizeDate } from "../../../helpers/date"
import { WEEKDAY_SHORT_LABELS } from "../../../constants/weekdays"


export const addDays = (date, amount) => {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

export const startOfDay = normalizeDate

export const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime()

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
const dayOnlyFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" })

// This usage is replaced by MultiReplaceFileContentTool below

export const formatDayLabel = date => dayFormatter.format(date)
export const formatDayHeaderLabel = date =>
  `${WEEKDAY_SHORT_LABELS[date.getDay()] || ""} ${dayOnlyFormatter.format(date)}`

export const getStartOfWeekSunday = date => {
  const d = new Date(date)
  const day = d.getDay()
  return addDays(d, -day)
}

const pad2 = n => String(n).padStart(2, "0")

export const formatRangeLabel = (referenceDate, view) => {
  if (view === "day") {
    return formatDayLabel(referenceDate)
  }
  const start = getStartOfWeekSunday(referenceDate)
  const end = addDays(start, 6)
  return `${formatDayLabel(start)} — ${formatDayLabel(end)}`
}

export const getStepForView = view => (view === "day" ? 1 : 7)

export const formatISODate = date => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const timeToMinutes = hhmm => {
  const parts = String(hhmm || "").split(":")
  if (parts.length !== 2) return Number.NaN
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN
  return h * 60 + m
}

export const minutesToTime = totalMinutes => {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${pad2(h)}:${pad2(m)}`
}
