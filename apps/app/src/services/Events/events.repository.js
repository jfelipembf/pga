import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const eventsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "events")

export const eventDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "events", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
