import { doc, runTransaction, serverTimestamp } from "firebase/firestore"
import { requireDb } from "./db"
import { requireBranchContext } from "./context"

/**
 * Get the next sequence number for a given counter name atomically.
 * Increments the counter in the database and returns the new value.
 * 
 * @param {string} counterName - Name of the counter (e.g. "clients", "orders")
 * @param {object} options
 * @param {number} options.startAt - Initial value if counter doesn't exist (default: 1)
 * @returns {Promise<number>} The next sequence number
 */
export const getNextSequence = async (counterName, { startAt = 1, ctxOverride = null } = {}) => {
    if (!counterName) throw new Error("Counter name is required")

    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    // Document path: tenants/{tenant}/branches/{branch}/counters/{counterName}
    const counterRef = doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "counters", counterName)

    try {
        const nextId = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef)

            let newValue
            if (!counterDoc.exists()) {
                newValue = startAt
            } else {
                const data = counterDoc.data()
                const current = Number(data.value) || 0
                newValue = current + 1
            }

            transaction.set(counterRef, {
                value: newValue,
                updatedAt: serverTimestamp()
            }, { merge: true })

            return newValue
        })

        return nextId
    } catch (error) {
        console.error(`Failed to generate next sequence for ${counterName}:`, error)
        throw error
    }
}
