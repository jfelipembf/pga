// src/services/activities/activities.repository.js

import { branchCollection, branchDoc, subCollection } from "../_core/refs"

export const activitiesCol = (db, ctx) => branchCollection(db, ctx, "activities")
export const activityDoc = (db, ctx, idActivity) => branchDoc(db, ctx, "activities", idActivity)

// objectives (subcollection)
export const activityObjectivesCol = (db, ctx, idActivity) => subCollection(activityDoc(db, ctx, idActivity), "objectives")

export const activityObjectiveDoc = (db, ctx, idActivity, idObjective) =>
  branchDoc(db, ctx, "activities", idActivity, "objectives", idObjective)

// topics (subcollection dentro de objective)
export const activityTopicsCol = (db, ctx, idActivity, idObjective) =>
  subCollection(activityObjectiveDoc(db, ctx, idActivity, idObjective), "topics")

export const activityTopicDoc = (db, ctx, idActivity, idObjective, idTopic) =>
  branchDoc(db, ctx, "activities", idActivity, "objectives", idObjective, "topics", idTopic)
