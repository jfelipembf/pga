import React from "react"
import classNames from "classnames"

import { parseMaxCapacity, getOccupancyPct } from "../Utils/occupancy"
import { getEventColor } from "../Utils/gridUtils"

const GradeEventCard = ({
  schedule,
  onClick,
  isSelected,
  selectionMode = false,
  selectionType = 'regular',
  isEnrolled = false // Nova prop para indicar matrícula existente
}) => {
  const startTime = String(schedule?.startTime || "")
  const endTime = String(schedule?.endTime || "")

  const maxCapacityRaw = schedule?.maxCapacity
  const maxCapacity = parseMaxCapacity(maxCapacityRaw)
  const enrolledCount = Math.max(0, Number(schedule?.enrolledCount || 0))
  const occupancyPct = getOccupancyPct(enrolledCount, maxCapacityRaw)

  const activityName = schedule?.activityName || "Atividade"
  const rawName = schedule?.employeeName || ""
  const employeeName = rawName ? `Prof. ${rawName.split(" ")[0]}` : ""
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
      className={classNames("grade-event", occupancyClass, {
        "grade-event--selected": isSelected && !selectionMode,
        "grade-cell--selected": isSelected && selectionMode && selectionType === 'regular',
        "grade-cell--selected-trial": isSelected && selectionMode && selectionType === 'trial',
        "grade-cell--enrolled": isEnrolled && selectionMode, // Nova classe para matrícula existente
        "selectable": selectionMode
      })}
      style={{}}
      onClick={(e) => {
        console.log("👉 [GradeEventCard] Clicked!", {
          id: schedule.id,
          idClass: schedule.idClass,
          idSession: schedule.idSession,
          sessionDate: schedule.sessionDate,
          enrolledCount: schedule.enrolledCount,
          maxCapacity: schedule.maxCapacity,
          type: schedule.sessionDate ? 'SESSION' : 'CLASS (TEMPLATE)',
          fullObject: schedule
        });
        if (onClick) onClick(e);
      }}
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
      <div className="grade-event__title">
        {activityName}

      </div>

      <div className="grade-event__details">
        {employeeName && (
          <div className="grade-event__meta">
            <i className="mdi mdi-account-star-outline me-1"></i>
            {employeeName}
          </div>
        )}
        {areaName && (
          <div className="grade-event__meta">
            <i className="mdi mdi-map-marker-outline me-1"></i>
            {areaName}
          </div>
        )}
      </div>

      {schedule?.attendanceRecorded && (
        <div className="grade-event__attendance" title="Presença confirmada">
          <i className="mdi mdi-check"></i>
        </div>
      )}

      {color && (
        <svg className="grade-event__wave" viewBox="0 0 120 25" preserveAspectRatio="none">
          <path d="M0,20 Q30,22 60,18 T120,15 L120,25 L0,25 Z" fill={color} fillOpacity="0.12" />
          <path d="M0,15 Q20,18 40,14 T80,12 Q100,10 120,13 L120,25 L0,25 Z" fill={color} fillOpacity="0.06" />
        </svg>
      )}
    </div>
  )
}

export default GradeEventCard
