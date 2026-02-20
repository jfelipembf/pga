import React from "react"
import { getStartOfWeek } from "../../../../utils/date"

export const useGradeControls = () => {
  const [referenceDate, setReferenceDate] = React.useState(new Date())
  const [turn, setTurn] = React.useState("all")
  const [view, setView] = React.useState("week")

  const weekStart = React.useMemo(() => getStartOfWeek(referenceDate), [referenceDate])

  return {
    referenceDate,
    setReferenceDate,
    turn,
    setTurn,
    view,
    setView,
    weekStart,
  }
}
