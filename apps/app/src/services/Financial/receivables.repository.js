import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const receivablesCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "receivables")

export const receivableDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "receivables", String(id))


export const getDb = () => requireDb()
export { getContext } from "../_core/context"
