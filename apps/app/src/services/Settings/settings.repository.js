import { doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const settingsGeneralDoc = (db, ctx) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "settings", "general")

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
