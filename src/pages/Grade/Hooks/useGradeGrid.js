import { useMemo } from "react"
import {
    addDays,
    toISODate,
    getStartOfWeek,
    normalizeDate,
    minutesToTime,
} from "../../../utils/date"
import { buildVisibleMinutes, isWithinTurn, occursOnDate } from "../Utils/gridUtils"

export const useGradeGrid = ({
    turn,
    view,
    referenceDate,
    weekStartProp,
    schedules
}) => {
    const weekStart = useMemo(() => {
        if (weekStartProp) {
            return weekStartProp
        }
        return getStartOfWeek(referenceDate)
    }, [referenceDate, weekStartProp])

    const days = useMemo(() => {
        if (view === "day") {
            return [normalizeDate(referenceDate)]
        }
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }, [view, weekStart, referenceDate])

    const timeRows = useMemo(() => {
        const mins = buildVisibleMinutes(turn, schedules)
        return mins.map(m => ({ mins: m, label: minutesToTime(m) }))
    }, [schedules, turn])

    const sortSchedules = (a, b) => {
        const aa = String(a?.idActivity || "")
        const ba = String(b?.idActivity || "")
        if (aa !== ba) return aa.localeCompare(ba)

        const an = String(a?.activityName || "")
        const bn = String(b?.activityName || "")
        if (an && bn && an !== bn) return an.localeCompare(bn)

        const ac = String(a?.idClass || "")
        const bc = String(b?.idClass || "")
        if (ac !== bc) return ac.localeCompare(bc)

        const aid = String(a?.idSession || a?.id || "")
        const bid = String(b?.idSession || b?.id || "")
        return aid.localeCompare(bid)
    }

    const schedulesByCell = useMemo(() => {
        const map = new Map()
        const safeSchedules = Array.isArray(schedules) ? schedules : []

        safeSchedules.forEach(s => {
            const startTime = s?.startTime
            if (!startTime || !isWithinTurn(turn, startTime)) return

            days.forEach(d => {
                const iso = toISODate(d)
                const dayIndex = d.getDay()
                if (occursOnDate(s, iso, dayIndex)) {
                    const key = `${iso}|${startTime}`
                    const existing = map.get(key) || []
                    map.set(key, [...existing, s])
                }
            })
        })

        // Optimized: Sort once per cell
        map.forEach((list, key) => {
            map.set(key, list.sort(sortSchedules))
        })

        return map
    }, [days, schedules, turn])

    const getCellSchedules = (iso, time) => {
        const key = `${iso}|${time}`
        return schedulesByCell.get(key) || []
    }

    return {
        weekStart,
        days,
        timeRows,
        getCellSchedules
    }
}
