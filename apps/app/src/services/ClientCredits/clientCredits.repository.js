import { collection } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const clientCreditsCol = (db, ctx, idClient) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", idClient, "credits")

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
