import { doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const dailySummaryDoc = (db, ctx, dateStr) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "dailySummary", dateStr)

export const monthlySummaryDoc = (db, ctx, monthId) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "monthlySummary", monthId)

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
