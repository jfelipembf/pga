import React from "react"
import { getStartOfWeekSunday } from "../../../Grade/Utils/dateUtils"

export const useGradeControls = () => {
  const [referenceDate, setReferenceDate] = React.useState(new Date())
  const [turn, setTurn] = React.useState("all")
  const [view, setView] = React.useState("week")
  const [showOccupancy, setShowOccupancy] = React.useState(true)

  const weekStart = React.useMemo(() => getStartOfWeekSunday(referenceDate), [referenceDate])

  return {
    referenceDate,
    setReferenceDate,
    turn,
    setTurn,
    view,
    setView,
    showOccupancy,
    setShowOccupancy,
    weekStart,
  }
}
