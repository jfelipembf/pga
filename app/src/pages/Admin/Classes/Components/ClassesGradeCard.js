import React from "react"
import { Card, CardBody } from "reactstrap"

import GradeGrid from "../../../Grade/Components/GradeGrid"
import GradeHeader from "../../../Grade/Components/GradeHeader"
import { getStartOfWeekSunday } from "../../../Grade/Utils/dateUtils"

export default function ClassesGradeCard({
  turn,
  onTurnChange,
  view,
  onViewChange,
  referenceDate,
  onReferenceDateChange,
  showOccupancy,
  onShowOccupancyChange,
  schedules,
  onClassClick,
  selectedClassId,
}) {
  return (
    <Card className="shadow-sm mt-4">
      <CardBody>
        <h5 className="mb-3">Grade das turmas</h5>

        <div className="mb-3">
          <GradeHeader
            turn={turn}
            onTurnChange={onTurnChange}
            view={view}
            onViewChange={onViewChange}
            referenceDate={referenceDate}
            onReferenceDateChange={onReferenceDateChange}
            showOccupancy={showOccupancy}
            onShowOccupancyChange={onShowOccupancyChange}
          />
        </div>

        <GradeGrid
          turn={turn}
          view={view}
          referenceDate={referenceDate}
          weekStart={getStartOfWeekSunday(referenceDate)}
          schedules={schedules}
          showOccupancy={showOccupancy}
          onSelectSchedule={onClassClick}
          selectedClassId={selectedClassId}
        />
      </CardBody>
    </Card>
  )
}
