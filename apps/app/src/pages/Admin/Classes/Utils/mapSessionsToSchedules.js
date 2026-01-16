const safeName = (obj = {}) =>
  obj.name || `${obj.firstName || ""} ${obj.lastName || ""}`.trim()

export const mapSessionsToSchedules = ({
  sessions = [],
  activities = [],
  areas = [],
  instructors = [],
}) => {
  const actsById = new Map((activities || []).map((a) => [a.id, a]))
  const areasById = new Map((areas || []).map((a) => [a.id, a]))
  const staffById = new Map((instructors || []).map((s) => [s.id, s]))

  return (sessions || []).map((sess) => {
    const activity = actsById.get(sess.idActivity) || {}
    const area = areasById.get(sess.idArea) || {}
    const instructor = staffById.get(sess.idStaff) || {}

    const weekday =
      sess.weekday !== undefined && sess.weekday !== null ? Number(sess.weekday) : null

    return {
      id: sess.idSession || sess.id,
      idClass: sess.idClass || null,
      idActivity: sess.idActivity,
      activityName: activity.name || sess.idActivity,
      areaName: area.name || "",
      employeeName: safeName(instructor) || sess.idStaff || "",
      startTime: sess.startTime || "",
      endTime: sess.endTime || "",
      startDate: sess.sessionDate || null,
      endDate: sess.sessionDate || null,
      sessionDate: sess.sessionDate || null,
      weekDays: weekday !== null ? [weekday] : [],
      color: activity.color || "#466b8f",
      maxCapacity: Number(sess.maxCapacity || 0),
      enrolledCount: Number(sess.enrolledCount || 0),
    }
  })
}
