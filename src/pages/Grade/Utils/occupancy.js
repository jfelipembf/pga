export const parseMaxCapacity = maxCapacityRaw => {
  const maxCapacityNumber = Number(maxCapacityRaw)
  return Number.isFinite(maxCapacityNumber) ? maxCapacityNumber : "-"
}

export const getOccupancyPct = (enrolledCount, maxCapacityRaw) => {
  const maxCapacityNumber = Number(maxCapacityRaw)
  if (!Number.isFinite(maxCapacityNumber) || maxCapacityNumber <= 0) return null
  return enrolledCount / maxCapacityNumber
}
