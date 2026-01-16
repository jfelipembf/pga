import React from "react"
import { computeEndTime } from "../../../Utils/computeEndTime"

export const useScheduleFormHandlers = ({
  values,
  disabled,
  handleChange,
  setFieldValue,
}) => {
  const currentWeekdays = React.useMemo(() => {
    if (!Array.isArray(values.weekDays)) return []
    return values.weekDays
  }, [values.weekDays])

  const handleStartTimeChange = (e) => {
    const nextStartTime = String(e?.target?.value || "")
    handleChange(e)
    const computedEnd = computeEndTime(nextStartTime, values.durationMinutes)
    setFieldValue?.("endTime", computedEnd)
  }

  const handleDurationChange = (e) => {
    const nextDuration = e?.target?.value
    handleChange(e)
    setFieldValue?.("durationMinutes", nextDuration)

    const numDuration = Number(nextDuration)
    if (Number.isFinite(numDuration) && numDuration > 0) {
      const computedEnd = computeEndTime(values.startTime, numDuration)
      setFieldValue?.("endTime", computedEnd)
    } else {
      setFieldValue?.("endTime", "")
    }
  }

  const handleWeekdayToggle = (value) => {
    if (disabled) return
    const list = Array.isArray(values.weekDays) ? [...values.weekDays] : []
    const exists = list.includes(value)
    const next = exists ? list.filter((day) => day !== value) : [...list, value]
    setFieldValue?.("weekDays", next)
  }

  return {
    currentWeekdays,
    handleStartTimeChange,
    handleDurationChange,
    handleWeekdayToggle,
  }
}
