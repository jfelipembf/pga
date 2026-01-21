const { deriveFullName } = require("../common");

const safeName = (obj = {}) => deriveFullName(obj);

/**
 * Maps sessions and classes to a unified grid format
 * @param {object} params
 * @param {Array} params.sessions - Lista de documentos da coleção 'sessions'
 * @param {Array} params.classes - Lista de documentos da coleção 'classes'
 * @param {Array} params.activities - Lista de atividades
 * @param {Array} params.areas - Lista de áreas/locais
 * @param {Array} params.instructors - Lista de funcionários/professores
 */
const mapToGridFormat = ({
    sessions = [],
    classes = [],
    activities = [],
    areas = [],
    instructors = [],
}) => {
    const actsById = new Map((activities || []).map((a) => [String(a.id), a]));
    const areasById = new Map((areas || []).map((a) => [String(a.id), a]));
    const staffById = new Map((instructors || []).map((s) => [String(s.id), s]));

    // 1. Mapear Sessões (Instâncias reais no calendário)
    const mappedSessions = (sessions || []).filter(Boolean).map((sess) => {
        const activity = actsById.get(String(sess.idActivity)) || {};
        const area = areasById.get(String(sess.idArea)) || {};
        const instructor = staffById.get(String(sess.idStaff)) || {};

        const weekday = sess.weekday !== undefined && sess.weekday !== null ? Number(sess.weekday) : null;

        return {
            id: sess.idSession || sess.id,
            idSession: sess.idSession || sess.id,
            idClass: sess.idClass || null,
            idActivity: sess.idActivity,

            activityName: activity.name || sess.activityName || sess.idActivity || "...",
            areaName: area.name || sess.areaName || "",
            employeeName: safeName(instructor) || sess.employeeName || sess.instructorName || "",

            startTime: sess.startTime || "",
            endTime: sess.endTime || "",
            sessionDate: sess.sessionDate || null,

            // Grid placement
            weekDays: weekday !== null ? [weekday] : [],

            color: activity.color || sess.color || "#466b8f",
            maxCapacity: Number(sess.maxCapacity || 0),
            enrolledCount: Number(sess.enrolledCount || 0),

            // Presence / Attendance
            attendanceRecorded: sess.attendanceRecorded || false,
            attendanceSnapshot: sess.attendanceSnapshot || [],
            presentCount: sess.presentCount || 0,
            absentCount: sess.absentCount || 0,

            isSession: true,
            originalData: sess
        };
    });

    // 2. Mapear Turmas (Templates recorrentes)
    const mappedClasses = (classes || []).filter(Boolean).map((cls) => {
        const activity = actsById.get(String(cls.idActivity)) || {};
        const area = areasById.get(String(cls.idArea)) || {};
        const instructor = staffById.get(String(cls.idStaff)) || {};

        const wd = (cls.weekday !== undefined && cls.weekday !== null)
            ? [Number(cls.weekday)]
            : [];

        return {
            id: cls.id,
            idClass: cls.id,
            idActivity: cls.idActivity,

            activityName: activity.name || cls.activityName || "...",
            areaName: area.name || cls.areaName || "",
            employeeName: safeName(instructor) || cls.employeeName || "",

            startTime: cls.startTime || "",
            endTime: cls.endTime || "",

            // Recurrence limits
            startDate: cls.startDate || null,
            endDate: cls.endDate || null,

            // Grid placement
            weekDays: wd,

            color: activity.color || cls.color || "#666",
            maxCapacity: Number(cls.maxCapacity || 0),
            enrolledCount: 0, // Classes as templates usually don't show real-time enrollment here

            isClass: true,
            editable: true,
            originalData: cls
        };
    });

    return [...mappedClasses, ...mappedSessions];
};

module.exports = {
    mapToGridFormat
};
