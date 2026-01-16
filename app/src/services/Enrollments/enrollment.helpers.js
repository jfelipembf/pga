import { ENROLLMENT_TYPES, ENROLLMENT_STATUS } from "./enrollment.types"

/**
 * Creates a standardized payload for Experimental/Single Session enrollment.
 * @param {object} params
 * @param {string} params.idClient
 * @param {object} params.session - The session object from the grid
 * @param {string} [params.status] - Default 'active'
 * @returns {object} Payload ready for Cloud Function
 */
export const createExperimentalPayload = ({ idClient, clientName, session, status = ENROLLMENT_STATUS.ACTIVE }) => {
    return {
        idClient,
        // Snapshot
        clientName: clientName || "",
        idClass: session.idClass || session.idActivity,
        idSession: session.idSession || session.id, // Ensure we grab the session ID
        sessionDate: session.sessionDate,
        status,
        type: ENROLLMENT_TYPES.EXPERIMENTAL,

        // Denormalized fields for UI display
        activityName: session.activityName || null,
        employeeName: session.employeeName || session.instructorName || null,
        startTime: session.startTime || null,
        endTime: session.endTime || null,
        weekday: session.weekday ?? (session.weekDays && session.weekDays[0]) ?? null,

        // Instructor Data
        instructorId: session.idStaff || session.idInstructor || null,
        instructorName: session.instructorName || session.employeeName || "",

        // Staff responsible for this enrollment (can be overwritten by caller)
        idStaff: null,
        staffName: ""
    }
}

/**
 * Creates a standardized payload for Recurring Enrollment.
 * @param {object} params
 * @param {string} params.idClient
 * @param {object} params.classData - The class object
 * @param {string} params.startDate
 * @param {string} [params.status]
 * @returns {object} Payload ready for Cloud Function
 */
export const createRecurringPayload = ({ idClient, clientName, classData, startDate, status = ENROLLMENT_STATUS.ACTIVE }) => {
    return {
        idClient,
        // Snapshot
        clientName: clientName || "",
        idClass: classData.idClass || classData.id,
        idActivity: classData.idActivity,
        startDate,
        status,
        type: ENROLLMENT_TYPES.RECURRING,

        // Denormalized
        activityName: classData.activityName || classData.name || null,
        employeeName: classData.employeeName || classData.instructorName || null, // If available
        weekday: classData.weekday ?? (classData.weekDays && classData.weekDays[0]) ?? null,
        startTime: classData.startTime || null,
        endTime: classData.endTime || null,

        // Instructor Data
        idStaff: classData.idStaff || classData.idInstructor || null,
        instructorName: classData.instructorName || classData.employeeName || ""
    }
}
