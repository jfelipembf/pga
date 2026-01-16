import { WEEKDAY_SHORT_LABELS } from "../../../constants/weekdays"

export const getWeekdayLabel = value => {

    if (typeof value === "number" && value >= 0 && value <= 6) return WEEKDAY_SHORT_LABELS[value]
    return value || "—"
}

export const renderSchedule = item => {
    const w = item.weekday ?? (Array.isArray(item.weekDays) ? item.weekDays[0] : null)
    const start = item.startTime
    const end = item.endTime
    if (item.type === 'experimental' || item.type === 'single-session') {
        const dateStr = item.sessionDate ? new Date(item.sessionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data n/a'
        const timeStr = (start && end) ? `${start} - ${end}` : (start || '??')
        return `${dateStr} · ${timeStr}`
    }

    // Recurring
    const weekdayLabel = w != null ? getWeekdayLabel(w) : null
    if (weekdayLabel && start) {
        return `${weekdayLabel} · ${start}${end ? ` - ${end}` : ""}`
    }
    if (start) {
        return `${start}${end ? ` - ${end}` : ""}`
    }

    if (item.schedule) return item.schedule
    return "—"
}

export const renderActivity = item => item.activityName || item.className || item.name || "—"

export const renderInstructor = item => item.employeeName || item.instructorName || "—"

export const isCanceled = item => (item.status || "").toLowerCase() === "canceled"
