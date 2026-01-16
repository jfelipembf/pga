import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const clientsEvaluationCol = (db, ctx, idClient) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", String(idClient), "evaluations")

export const clientEvaluationDoc = (db, ctx, idClient, idEvaluation) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", String(idClient), "evaluations", String(idEvaluation))

export const getContext = (ctxOverride) => {
    if (ctxOverride) return ctxOverride
    return requireBranchContext()
}

export const getDb = () => requireDb()
