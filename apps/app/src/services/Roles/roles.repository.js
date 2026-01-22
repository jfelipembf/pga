import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const rolesCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "roles")

export const roleDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "roles", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
