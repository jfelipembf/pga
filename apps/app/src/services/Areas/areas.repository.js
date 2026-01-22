import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const areasCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "areas")

export const areaDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "areas", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
