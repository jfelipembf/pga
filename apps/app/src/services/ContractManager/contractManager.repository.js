import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const contractsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "contractTemplates")

export const contractDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "contractTemplates", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
