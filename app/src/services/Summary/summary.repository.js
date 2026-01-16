import { doc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const dailySummaryDoc = (db, ctx, dateStr) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "dailySummary", dateStr)

export const monthlySummaryDoc = (db, ctx, monthId) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "monthlySummary", monthId)

export const getContext = (ctxOverride) => {
    if (ctxOverride) return ctxOverride
    return requireBranchContext()
}

export const getDb = () => requireDb()
