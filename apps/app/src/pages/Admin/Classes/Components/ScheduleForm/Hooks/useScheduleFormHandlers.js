import React from "react"
import { timeToMinutes, minutesToTime } from "@pga/shared"

export const useScheduleFormHandlers = ({
  values,
  disabled,
  handleChange,
  setFieldValue,
}) => {
  const currentWeekdays = React.useMemo(() => {
    if (Array.isArray(values.weekdays)) return values.weekdays
    return (values.weekday !== undefined && values.weekday !== null) ? [Number(values.weekday)] : []
  }, [values.weekday, values.weekdays])

  const handleStartTimeChange = (e) => {
    const nextStartTime = String(e?.target?.value || "")
    handleChange(e)
    const computedEnd = minutesToTime(timeToMinutes(nextStartTime) + Number(values.durationMinutes))
    setFieldValue?.("endTime", computedEnd)
  }

  const handleDurationChange = (e) => {
    const nextDuration = e?.target?.value
    handleChange(e)
    setFieldValue?.("durationMinutes", nextDuration)

    const numDuration = Number(nextDuration)
    if (Number.isFinite(numDuration) && numDuration > 0) {
      const computedEnd = minutesToTime(timeToMinutes(values.startTime) + numDuration)
      setFieldValue?.("endTime", computedEnd)
    } else {
      setFieldValue?.("endTime", "")
    }
  }

  const handleWeekdayToggle = (value) => {
    if (disabled) return

    // If we are editing an existing single class, we might still want multi-select for creation,
    // but for now, let's keep it simple: if there's an ID, it's single select. If not, it's multi.
    if (values.id) {
      const nextValue = values.weekday === value ? null : value
      setFieldValue?.("weekday", nextValue)
      return
    }

    // MULTI SELECT for creation
    const prev = Array.isArray(values.weekdays) ? values.weekdays : []
    const next = prev.includes(value)
      ? prev.filter(v => v !== value)
      : [...prev, value]

    setFieldValue?.("weekdays", next)
    // Also set the first one to 'weekday' for backward compatibility/payload builder if needed
    setFieldValue?.("weekday", next.length > 0 ? next[0] : null)
  }

  return {
    currentWeekdays,
    handleStartTimeChange,
    handleDurationChange,
    handleWeekdayToggle,
  }
}
