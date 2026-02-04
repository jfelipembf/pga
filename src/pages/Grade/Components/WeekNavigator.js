import React from "react"
import { Button } from "reactstrap"

import {
  addDays,
  getStepForView,
  formatRangeLabel,
  getStartOfWeek
} from "../../../utils/sharedUtils"

const WeekNavigator = ({ referenceDate, view, onReferenceDateChange }) => {
  const step = getStepForView(view)

  let startDate = referenceDate
  let endDate = referenceDate

  if (view === 'week') {
    startDate = getStartOfWeek(referenceDate)
    endDate = addDays(startDate, 6)
  }

  const label = formatRangeLabel(startDate, endDate, view)

  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        color="light"
        size="sm"
        onClick={() => onReferenceDateChange(addDays(referenceDate, -step))}
      >
        <i className="mdi mdi-chevron-left" />
      </Button>
      <div className="text-muted small fw-semibold text-uppercase">{label}</div>
      <Button
        color="light"
        size="sm"
        onClick={() => onReferenceDateChange(addDays(referenceDate, step))}
      >
        <i className="mdi mdi-chevron-right" />
      </Button>
    </div>
  )
}

export default WeekNavigator
