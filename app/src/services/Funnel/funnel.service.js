import { addDoc, serverTimestamp } from "firebase/firestore"
import { funnelEventsCollectionRef, getDb, getContext } from "./funnel.repository"
import { FUNNEL_STEPS, FUNNEL_EVENTS, FUNNEL_FIELDS } from "./funnel.types"

/**
 * Logs a generic funnel event to the client's subcollection.
 * @param {string} clientId 
 * @param {string} step - One of FUNNEL_STEPS
 * @param {object} metadata - Additional fields (instructorId, saleId, etc.)
 */
export const logFunnelEvent = async (clientId, step, metadata = {}) => {
    const db = getDb()
    const ctx = getContext()

    if (!clientId) throw new Error("Client ID is required to log funnel event")
    if (!step) throw new Error("Funnel Step is required")

    const eventName = FUNNEL_EVENTS[step] || 'unknown_event'

    const payload = {
        [FUNNEL_FIELDS.TYPE]: step,
        [FUNNEL_FIELDS.EVENT_NAME]: eventName,
        [FUNNEL_FIELDS.CLIENT_ID]: clientId,
        [FUNNEL_FIELDS.TIMESTAMP]: new Date().toISOString(),
        [FUNNEL_FIELDS.CREATED_AT]: serverTimestamp(),
        ...metadata
    }

    try {
        const ref = funnelEventsCollectionRef(db, ctx, clientId)
        const docRef = await addDoc(ref, payload)
        return { id: docRef.id, ...payload }
    } catch (error) {
        console.error(`Error logging funnel event [${step}]:`, error)
        // We do strictly throw here? Ideally logging shouldn't break the main flow, 
        // but for now let's report it.
        throw error
    }
}

/**
 * 1. Log New Lead
 * Should be called when a client is created.
 */
export const logNewLead = async (clientId, { createdBy } = {}) => {
    return logFunnelEvent(clientId, FUNNEL_STEPS.LEAD, {
        [FUNNEL_FIELDS.CREATED_BY]: createdBy || 'system'
    })
}

/**
 * 2. Log Experimental Scheduling
 * Called when an experimental class is scheduled.
 */
export const logExperimentalScheduling = async (clientId, { classId, sessionId, date, instructorId }) => {
    return logFunnelEvent(clientId, FUNNEL_STEPS.EXPERIMENTAL_SCHEDULED, {
        [FUNNEL_FIELDS.CLASS_ID]: classId,
        [FUNNEL_FIELDS.SESSION_ID]: sessionId,
        [FUNNEL_FIELDS.INSTRUCTOR_ID]: instructorId,
        scheduledDate: date
    })
}

/**
 * 2b. Log Experimental Cancellation
 * Called when an experimental class is cancelled (enrollment deleted).
 */
export const logExperimentalCancellation = async (clientId, { classId, sessionId }) => {
    return logFunnelEvent(clientId, FUNNEL_STEPS.EXPERIMENTAL_CANCELLED, {
        [FUNNEL_FIELDS.CLASS_ID]: classId,
        [FUNNEL_FIELDS.SESSION_ID]: sessionId
    })
}

/**
 * 3. Log Experimental Attendance (Confirmed)
 * Called when attendance is marked as present for an experimental enrollment.
 */
export const logExperimentalAttendance = async (clientId, { classId, sessionId, instructorId, instructorName }) => {
    return logFunnelEvent(clientId, FUNNEL_STEPS.EXPERIMENTAL_ATTENDED, {
        [FUNNEL_FIELDS.CLASS_ID]: classId,
        [FUNNEL_FIELDS.SESSION_ID]: sessionId,
        [FUNNEL_FIELDS.INSTRUCTOR_ID]: instructorId,
        [FUNNEL_FIELDS.INSTRUCTOR_NAME]: instructorName
    })
}

/**
 * 4. Log Conversion (Sale)
 * Called when a contract is signed/sale is made.
 */
export const logConversion = async (clientId, { saleId, contractId, salesRepId, salesRepName, amount }) => {
    return logFunnelEvent(clientId, FUNNEL_STEPS.CONVERSION, {
        [FUNNEL_FIELDS.SALE_ID]: saleId,
        [FUNNEL_FIELDS.CONTRACT_ID]: contractId,
        [FUNNEL_FIELDS.SALES_REP_ID]: salesRepId,
        [FUNNEL_FIELDS.SALES_REP_NAME]: salesRepName,
        amount: amount
    })
}
