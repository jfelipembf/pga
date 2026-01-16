import { branchCollection, branchDoc } from "../_core/refs"

export const trainingPlansCol = (db, ctx) => branchCollection(db, ctx, "training_plans")
export const trainingPlanDoc = (db, ctx, idPlan) => branchDoc(db, ctx, "training_plans", idPlan)
