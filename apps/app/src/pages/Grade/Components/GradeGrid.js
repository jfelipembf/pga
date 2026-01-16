import React, { useMemo } from "react"

import OverlayLoader from "../../../components/Common/OverlayLoader"

import {
  addDays,
  formatDayHeaderLabel,
  formatISODate,
  getStartOfWeekSunday,
  isSameDay,
  minutesToTime,
} from "../Utils/dateUtils"
import { buildVisibleMinutes, isWithinTurn, occursOnDate } from "../Utils/gridUtils"
import { normalizeDate } from "../../../helpers/date"
import GradeEventCard from "./GradeEventCard"

const GradeGrid = ({
  turn,
  view,
  referenceDate,
  weekStart: weekStartProp,
  schedules,
  showOccupancy,
  loading,
  onSelectSchedule,
  selectedScheduleId,
  selectedScheduleIds,
  selectedScheduleKey,
  onToggleSelection,
  selectedClassId,
}) => {

  const weekStart = useMemo(() => {
    if (weekStartProp) {
      return getStartOfWeekSunday(weekStartProp)
    }
    return getStartOfWeekSunday(referenceDate)
  }, [referenceDate, weekStartProp])

  const selectedSet = useMemo(() => {
    return new Set((Array.isArray(selectedScheduleIds) ? selectedScheduleIds : []).map(String))
  }, [selectedScheduleIds])

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

  const schedulesByCell = useMemo(() => {
    const map = new Map()
      ; (Array.isArray(schedules) ? schedules : []).forEach(s => {
        if (!s || typeof s !== 'object') return // ← guarda contra undefined/null
        const startTime = String(s?.startTime || "")
        if (!startTime) return
        if (!isWithinTurn(turn, startTime)) return

        days.forEach(d => {
          const iso = formatISODate(d)
          const dayIndex = d.getDay()
          if (!occursOnDate(s, iso, dayIndex)) return

          const key = `${iso}|${startTime}`
          map.set(key, [...(map.get(key) || []), s])
        })
      })
    return map
  }, [days, schedules, turn])

  return (
    <div className="grade-grid table-responsive position-relative">
      <div
        className="grade-grid__inner"
        style={{
          display: "grid",
          gridTemplateColumns: `96px repeat(${days.length}, minmax(180px, 1fr))`,
          minWidth: "720px",
          opacity: loading ? 0.45 : 1,
        }}
      >
        <div className="grade-grid__corner" />
        {days.map(d => (
          <div
            key={formatISODate(d)}
            className={`grade-grid__header ${isSameDay(d, referenceDate) ? "is-today" : ""}`}
          >
            {formatDayHeaderLabel(d)}
          </div>
        ))}

        {timeRows.map(t => (
          <React.Fragment key={t.label}>
            <div className="grade-grid__time">{t.label}</div>
            {days.map(d => {
              const iso = formatISODate(d)
              const key = `${iso}|${t.label}`
              const cellSchedules = (schedulesByCell.get(key) || []).slice().sort((a, b) => {
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
              })


              const selected = isSameDay(d, referenceDate)

              return (
                <div
                  key={`${iso}-${t.label}`}
                  className={`grade-grid__cell ${selected ? "is-reference" : ""}`}
                >
                  {cellSchedules.filter(Boolean).map(s => (
                    <div key={s.idSession || s.id || `${s.startTime}-${s.activityName || ""}`} className="mb-2">
                      <GradeEventCard
                        schedule={s}
                        showOccupancyMask={Boolean(showOccupancy)}
                        onClick={
                          onToggleSelection
                            ? () => onToggleSelection(s, iso)
                            : onSelectSchedule
                              ? () => onSelectSchedule(s, iso)
                              : undefined
                        }
                        isSelected={
                          selectedClassId
                            ? String(s.idClass) === String(selectedClassId)
                            : selectedScheduleKey
                              ? selectedScheduleKey === `${String(s.id)}|${iso}`
                              : selectedSet.size > 0
                                ? selectedSet.has(String(s.id))
                                : selectedScheduleId
                                  ? String(s.id) === selectedScheduleId
                                  : false
                        }
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <OverlayLoader show={loading} />
    </div>
  )
}

export default GradeGrid
