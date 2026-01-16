export const mapSessionsToSchedules = (sessions, activities, areas, staff) => {
    const base = (Array.isArray(sessions) ? sessions : []).filter(Boolean)

    if (base.length > 0) {


    }

    const mapped = base.map((sess) => {
        if (!sess || typeof sess !== "object") {
            return null
        }

        const instr = staff.find(i => String(i.id) === String(sess.idStaff)) || {}

        if (sess.idStaff && !instr.id) {
            console.warn("DEBUG: Teacher not found for session", {
                sessionId: sess.idSession || sess.id,
                idStaff: sess.idStaff,
                staffIds: staff.map(s => s.id)
            })
        }

        const activity = activities.find(a => String(a.id) === String(sess.idActivity)) || {}
        const area = areas.find(a => String(a.id) === String(sess.idArea)) || {}
        const weekday = sess.weekday !== undefined && sess.weekday !== null ? Number(sess.weekday) : null
        const id = sess.idSession || sess.id
        if (!id) {
            return null
        }

        return {
            id,
            idSession: sess.idSession || sess.id,
            idClass: sess.idClass || null,
            idActivity: sess.idActivity,
            activityName: activity.name || sess.idActivity,
            areaName: area.name || "",
            employeeName: instr.name || `${instr.firstName || ""} ${instr.lastName || ""} `.trim(),
            startTime: sess.startTime || "",
            endTime: sess.endTime || "",
            sessionDate: sess.sessionDate || null,
            weekDays: weekday !== null ? [weekday] : [],
            color: activity.color || "#466b8f",
            maxCapacity: Number(sess.maxCapacity || 0),
            enrolledCount: Number(sess.enrolledCount || 0),
            // Campos adicionais para presença
            attendanceRecorded: sess.attendanceRecorded || false,
            attendanceSnapshot: sess.attendanceSnapshot || [],
            presentCount: sess.presentCount || 0,
            absentCount: sess.absentCount || 0,
        }
    })

    return mapped.filter(Boolean)
}
