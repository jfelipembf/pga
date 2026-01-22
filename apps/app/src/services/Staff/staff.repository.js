import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const staffCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "staff")

export const staffDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "staff", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
