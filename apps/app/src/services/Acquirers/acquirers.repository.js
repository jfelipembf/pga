import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const acquirersCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "acquirers")

export const acquirerDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "acquirers", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
