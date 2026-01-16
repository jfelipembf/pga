import { getDocs, query, orderBy, limit, where } from "firebase/firestore"
import { collection, Timestamp } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

/**
 * Busca os logs de auditoria da unidade atual.
 */
export const listAuditLogs = async ({ maxResults = 100, date = null } = {}) => {
    const db = requireDb()
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
        timestamp: doc.data().timestamp?.toDate() || new Date()
    }))
}
