export const mapSessionsToEvaluationSchedules = (sessions, activities, areas, staff) => {
    const base = (Array.isArray(sessions) ? sessions : []).filter(Boolean)
    return base
        .map(sess => {
            if (!sess || typeof sess !== "object") return null

            const activity = activities.find(a => a.id === sess.idActivity) || {}
            const area = areas.find(a => a.id === sess.idArea) || {}
            const instr = staff.find(i => i.id === sess.idStaff) || {}
            const weekday = sess.weekday !== undefined && sess.weekday !== null ? Number(sess.weekday) : null
            const id = sess.idSession || sess.id
            if (!id) return null

            return {
                id,
                idSession: sess.idSession || sess.id,
                idClass: sess.idClass || null,
                idActivity: sess.idActivity,
                activityName: activity.name || sess.idActivity,
                areaName: area.name || "",
                employeeName: instr.name || `${instr.firstName || ""} ${instr.lastName || ""}`.trim(),
                startTime: sess.startTime || "",
                endTime: sess.endTime || "",
                sessionDate: sess.sessionDate || null,
                weekDays: weekday !== null ? [weekday] : [],
                color: activity.color || "#466b8f",
                maxCapacity: Number(sess.maxCapacity || 0),
                enrolledCount: Number(sess.enrolledCount || 0),
                attendanceRecorded: sess.attendanceRecorded || false,
                attendanceSnapshot: sess.attendanceSnapshot || [],
                presentCount: sess.presentCount || 0,
                absentCount: sess.absentCount || 0,
            }
        })
        .filter(Boolean)
}
