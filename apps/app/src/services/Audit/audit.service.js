import { getDocs, query, orderBy, limit, where, collection, Timestamp } from "firebase/firestore"
import { getDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { timestampToDate } from "../_core/timestamp"

/**
 * Busca os logs de auditoria da unidade atual.
 */
export const listAuditLogs = async ({ maxResults = 100, date = null } = {}) => {
    const db = getDb()
    const ctx = requireBranchContext()

    const ref = collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "auditLog")

    let q;

    if (date) {
        // Range for the whole day (local time approx or UTC based on input)
        // Assuming date is YYYY-MM-DD
        const start = new Date(date + "T00:00:00")
        const end = new Date(date + "T23:59:59")

        q = query(
            ref,
            where("timestamp", ">=", Timestamp.fromDate(start)),
            where("timestamp", "<=", Timestamp.fromDate(end)),
            orderBy("timestamp", "desc"),
            limit(maxResults)
        )
    } else {
        q = query(ref, orderBy("timestamp", "desc"), limit(maxResults))
    }

    const snap = await getDocs(q)
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converter Timestamp para Date para facilitar exibição
        timestamp: timestampToDate(doc.data().timestamp) || new Date()
    }))
}
