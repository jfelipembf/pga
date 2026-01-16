import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const acquirersCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "acquirers")

export const acquirerDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "acquirers", String(id))

export const getContext = (ctxOverride) => {
    if (ctxOverride) return ctxOverride
    return requireBranchContext()
}

export const getDb = () => requireDb()
