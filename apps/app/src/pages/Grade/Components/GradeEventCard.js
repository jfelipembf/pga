import React from "react"
import classNames from "classnames"

import { parseMaxCapacity, getOccupancyPct } from "../Utils/occupancy"
import { getEventColor } from "../Utils/gridUtils"

const GradeEventCard = ({ schedule, showOccupancyMask, onClick, isSelected }) => {
  const startTime = String(schedule?.startTime || "")
  const endTime = String(schedule?.endTime || "")

  const maxCapacityRaw = schedule?.maxCapacity
  const maxCapacity = parseMaxCapacity(maxCapacityRaw)
  const enrolledCount = Math.max(0, Number(schedule?.enrolledCount || 0))
  const occupancyPct = getOccupancyPct(enrolledCount, maxCapacityRaw)

  const activityName = schedule?.activityName || schedule?.name || schedule?.idActivity || "Turma"
  const employeeName = schedule?.employeeName || schedule?.instructorName || ""
  const areaName = schedule?.areaName || ""

  const color = getEventColor(schedule)

  const occupancyClass =
    occupancyPct === null
      ? ""
      : occupancyPct >= 1
        ? "grade-event--full"
        : occupancyPct >= 0.7
          ? "grade-event--busy"
          : "grade-event--ok"

  return (
    <div
      className={classNames("grade-event", occupancyClass, { "grade-event--selected": isSelected })}
      style={color ? {
        borderTop: `3px solid ${color} `,
        position: 'relative',
        overflow: 'hidden'
      } : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="grade-event__top">
        <span className="grade-event__time">
          {startTime} — {endTime}
        </span>
        <span className="grade-event__capacity">
          {enrolledCount}/{maxCapacity === "-" ? "—" : maxCapacity}
        </span>
      </div>
      <div className="grade-event__title">{activityName}</div>
      {employeeName ? <div className="grade-event__meta">{employeeName}</div> : null}
      {areaName ? <div className="grade-event__meta">{areaName}</div> : null}

      {schedule?.attendanceRecorded && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            zIndex: 10,
            width: '20px',
            height: '20px',
            backgroundColor: '#28a745',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            border: '2px solid white'
          }}
          title="Presença confirmada"
        >
          <i className="mdi mdi-check" style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}></i>
        </div>
      )}

      {color && (
        <svg
          className="grade-event__wave"
          viewBox="0 0 120 25"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '25px'
          }}
        >
          {/* Onda de baixo - começa embaixo e sobe */}
          <path
            d="M0,20 Q30,22 60,18 T120,15 L120,25 L0,25 Z"
            fill={color}
            fillOpacity="0.15"
          />
          {/* Onda de cima - começa mais acima e termina mais alta */}
          <path
            d="M0,15 Q20,18 40,14 T80,12 Q100,10 120,13 L120,25 L0,25 Z"
            fill={color}
            fillOpacity="0.08"
          />
          {/* Onda intermediária para profundidade */}
          <path
            d="M0,18 Q25,20 50,16 T100,14 Q110,13 120,16 L120,25 L0,25 Z"
            fill={color}
            fillOpacity="0.05"
          />
        </svg>
      )}
    </div>
  )
}

export default GradeEventCard
