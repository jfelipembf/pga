import { collection } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const clientCreditsCol = (db, ctx, idClient) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", idClient, "credits")

export const getContext = (ctxOverride) => {
    if (ctxOverride) return ctxOverride
    return requireBranchContext()
}

export const getDb = () => requireDb()
