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
      startDate: sess.sessionDate || null, // specific date
      endDate: sess.sessionDate || null,
      sessionDate: sess.sessionDate || null,
      weekDays: null, // Sessions are specific instances, no recurrence usually needed if date is set
      // However, if the grid expects weekDays for logic, we keep it. 
      // But usually sessions = specific date.

      color: activity.color || "#466b8f",
      maxCapacity: Number(sess.maxCapacity || 0),
      enrolledCount: Number(sess.enrolledCount || 0),
      isSession: true
    }
  })



  // simple deduping or just merging?
  // If we show BOTH, we might see duplicates on the grid if the grid handles both recurrence and instances.
  // Strategy: For Administration, we often want to see the Class Definition (Template).
  // If the user created a class, they want to see the Class Configuration on the grid.
  // Sessions are instances.
  // Let's return ONLY mappedClasses if we are in "Grade" mode, or mix them.
  // Given the user complained "Turma" (Class) didn't show up, showing the Class Definition is the safest bet.
  // If actual sessions render on top, that's acceptable for now.

  // Return ONLY sessions to prevent duplicates on the grid (Template + Session)
  // Since sessions are auto-generated, they are the source of truth for the schedule.
  return [...mappedSessions];
}
