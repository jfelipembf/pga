export const computeEndTime = (startTime, durationMinutes) => {
  const parts = String(startTime || "").split(":")
  if (parts.length !== 2) return ""

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return ""

  const duration = Number(durationMinutes)
  if (!Number.isFinite(duration) || duration <= 0) return ""

  const totalMinutes = hours * 60 + minutes + duration
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)

  const endHours = Math.floor(normalized / 60)
  const endMinutes = normalized % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
}
