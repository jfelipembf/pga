import { getDocs, query, where, collection } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { getTodayISO } from "../../utils/date"

/**
 * Marca um alerta (aniversário ou vencimento) como concluído com auditoria via Cloud Function.
 */
export const markAlertAsCompleted = async (alertData) => {
    const fns = requireFunctions()
    const ctx = requireBranchContext()
    const completeOperationalAlertFn = httpsCallable(fns, "completeOperationalAlert")

    return await completeOperationalAlertFn({
        ...alertData,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch
    })
}

/**
 * Busca alertas concluídos na data de hoje para filtrar a visualização.
 */
export const getTodayCompletedAlerts = async () => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const today = getTodayISO()

    const ref = collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "alertCompletions")
    const q = query(
        ref,
        where("completionDate", "==", today)
    )

    const snap = await getDocs(q)
    return snap.docs.map(d => d.id)
}
