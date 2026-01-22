import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const enrollmentsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "enrollments")

export const enrollmentDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "enrollments", String(id))

export const clientDoc = (db, ctx, idClient) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", String(idClient))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
