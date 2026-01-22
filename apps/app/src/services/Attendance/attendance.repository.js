import { doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const sessionDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "sessions", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
