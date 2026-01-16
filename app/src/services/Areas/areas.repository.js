import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const areasCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "areas")

export const areaDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "areas", String(id))

export const getContext = (ctxOverride) => {
    if (ctxOverride) return ctxOverride
    return requireBranchContext()
}

export const getDb = () => requireDb()
