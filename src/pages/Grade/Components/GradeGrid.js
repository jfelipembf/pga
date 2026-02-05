import React, { useMemo } from "react"

import OverlayLoader from "../../../components/Common/OverlayLoader"

import {
  addDays,
  formatDayHeaderLabel,
  toISODate,
  isSameDay,
  minutesToTime,
} from "../../../utils/sharedUtils"
import { buildVisibleMinutes, isWithinTurn, occursOnDate } from "../Utils/gridUtils"
import { normalizeDate } from "../../../utils/sharedUtils"
import GradeEventCard from "./GradeEventCard"

import { useGradeGrid } from "../Hooks/useGradeGrid"

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
  // Novos props para modo de seleção (matrícula)
  mode = 'view', // 'view' | 'selection'
  selectedClasses = [],
  selectedSession = null,
  isClassSelected = null,
  isClassEnrolled = null, // Nova prop para indicar turmas já matriculadas
}) => {
  const { days, timeRows, getCellSchedules } = useGradeGrid({
    turn,
    view,
    referenceDate,
    weekStartProp,
    schedules
  })

  const selectedSet = useMemo(() => {
    return new Set((Array.isArray(selectedScheduleIds) ? selectedScheduleIds : []).map(String))
  }, [selectedScheduleIds])

  return (
    <div className="grade-grid table-responsive position-relative">
      <div
        className="grade-grid__inner"
        style={{
          display: "grid",
          gridTemplateColumns: `96px repeat(${days.length}, minmax(130px, 1fr))`,
          minWidth: "100%",
          opacity: loading ? 0.45 : 1,
        }}
      >
        <div className="grade-grid__corner" />
        {days.map(d => (
          <div
            key={toISODate(d)}
            className={`grade-grid__header ${isSameDay(d, referenceDate) ? "is-today" : ""}`}
          >
            {formatDayHeaderLabel(d)}
          </div>
        ))}

        {timeRows.map(t => (
          <React.Fragment key={t.label}>
            <div className="grade-grid__time">{t.label}</div>
            {days.map(d => {
              const iso = toISODate(d)
              const cellSchedules = getCellSchedules(iso, t.label)


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
                          mode === 'selection'
                            ? (isClassSelected ? isClassSelected(s) : false)
                            : selectedClassId
                              ? String(s.idClass) === String(selectedClassId)
                              : selectedScheduleKey
                                ? selectedScheduleKey === `${String(s.id)}|${iso}`
                                : selectedSet.size > 0
                                  ? selectedSet.has(String(s.id))
                                  : selectedScheduleId
                                    ? String(s.id) === selectedScheduleId
                                    : false
                        }
                        selectionMode={mode === 'selection'}
                        selectionType={selectedSession === s.id ? 'trial' : 'regular'}
                        isEnrolled={isClassEnrolled ? isClassEnrolled(s) : false}
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
