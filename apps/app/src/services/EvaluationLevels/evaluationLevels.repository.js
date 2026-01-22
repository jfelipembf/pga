import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const evaluationLevelsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "evaluationLevels")

export const evaluationLevelDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "evaluationLevels", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
