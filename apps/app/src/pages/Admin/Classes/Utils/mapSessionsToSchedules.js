const safeName = (obj = {}) =>
  obj.name || `${obj.firstName || ""} ${obj.lastName || ""}`.trim()

export const mapSessionsToSchedules = ({
  sessions = [],
  classes = [],
  activities = [],
  areas = [],
  instructors = [],
}) => {
  const actsById = new Map((activities || []).map((a) => [a.id, a]))
  const areasById = new Map((areas || []).map((a) => [a.id, a]))
  const staffById = new Map((instructors || []).map((s) => [s.id, s]))

  const mappedSessions = (sessions || []).map((sess) => {
    const activity = actsById.get(sess.idActivity) || {}
    const area = areasById.get(sess.idArea) || {}
    const instructor = staffById.get(sess.idStaff) || {}

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
      weekDays: [Number(sess.weekday)], // Added weekday for grid placement
      color: activity.color || "#466b8f",
      maxCapacity: Number(sess.maxCapacity || 0),
      enrolledCount: Number(sess.enrolledCount || 0),
      isSession: true
    }
  })

  const mappedClasses = (classes || []).map((cls) => {
    const activity = actsById.get(cls.idActivity) || {}
    const area = areasById.get(cls.idArea) || {}
    const instructor = staffById.get(cls.idStaff) || {}

    const wd = (cls.weekday !== undefined && cls.weekday !== null)
      ? [Number(cls.weekday)]
      : (Array.isArray(cls.weekDays) ? cls.weekDays.map(Number) : [])

    return {
      id: cls.id,
      idClass: cls.id,
      idActivity: cls.idActivity,
      activityName: activity.name || "...",
      areaName: area.name || "",
      employeeName: safeName(instructor) || "...",
      startTime: cls.startTime,
      endTime: cls.endTime,
      weekDays: wd,
      color: activity.color || "#666",
      maxCapacity: Number(cls.maxCapacity || 0),
      enrolledCount: 0,
      isClass: true,
      editable: true
    }
  })

  // Return both. Grid will handle rendering. 
  // Usually we prioritze Classes in the Admin view.
  return [...mappedClasses, ...mappedSessions];
}
