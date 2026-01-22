import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const clientsEvaluationCol = (db, ctx, idClient) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", String(idClient), "evaluations")

export const clientEvaluationDoc = (db, ctx, idClient, idEvaluation) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", String(idClient), "evaluations", String(idEvaluation))

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
