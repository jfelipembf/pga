import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const productsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "products")

export const productDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "products", String(id))

export const servicesCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "services")

export const serviceDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "services", String(id))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
