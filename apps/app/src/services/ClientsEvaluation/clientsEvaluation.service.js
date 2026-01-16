import {
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore"

import { clientsEvaluationCol, getContext, getDb } from "./clientsEvaluation.repository"

export const createClientEvaluation = async ({
  idClient,
  idActivity,
  idClass = null,
  idSession = null,
  levelsByTopicId = {},
  eventTypeName = "avaliação",
  startAt = null,
  endAt = null,
  eventPlanId = null,
  updatedByUserId = null,
  ctxOverride = null,
}) => {
  if (!idClient) throw new Error("idClient é obrigatório")
  if (!idActivity) throw new Error("idActivity é obrigatório")

  const ctx = getContext(ctxOverride)

  // Use makeCreatePayload but custom fields need mapping first or pass raw
  // The service logic here is complex with mapping, so we keep the mapping but use standard payload helper for metadata

  const data = {
    clientId: String(idClient),
    idClient: String(idClient),
    idActivity: String(idActivity),
    idClass: idClass != null ? String(idClass) : null,
    idSession: idSession != null ? String(idSession) : null,

    eventTypeName,
    eventPlanId: eventPlanId != null ? String(eventPlanId) : null,
    startAt,
    endAt,

    levelsByTopicId: levelsByTopicId && typeof levelsByTopicId === "object" ? levelsByTopicId : {},
    updatedByUserId: updatedByUserId != null ? String(updatedByUserId) : null,
  }

  // REFACTOR: Use Cloud Function for Create to ensure Automations trigger
  // const payload = makeCreatePayload(data, ctx)
  // const ref = await addDoc(col, payload)
  // return { id: ref.id, ...payload }

  const { getFirebaseFunctions } = require("../../helpers/firebase_helper");
  const { httpsCallable } = require("firebase/functions");

  const functions = getFirebaseFunctions();
  const saveFunc = httpsCallable(functions, "saveEvaluation");

  const result = await saveFunc({
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,
    idClient: String(idClient),
    action: "create",
    payload: data // Passing raw data, let backend handle timestamps/metadata or we pass it partially
  });

  return result.data;
}

export const getLastClientEvaluation = async ({ idClient, idActivity, idTopic, ctxOverride = null }) => {
  if (!idClient || !idActivity || !idTopic) return null

  const db = getDb()
  const ctx = getContext(ctxOverride)

  const col = clientsEvaluationCol(db, ctx, idClient)
  const q = query(
    col,
    where("idActivity", "==", String(idActivity)),
    orderBy("createdAt", "desc"),
    limit(1)
  )

  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const data = d.data() || {}
  const levelsMap = data.levelsByTopicId && typeof data.levelsByTopicId === "object" ? data.levelsByTopicId : {}
  const levelInfo = levelsMap[String(idTopic)] || null
  if (!levelInfo) return null

  return {
    id: d.id,
    idClient: String(idClient),
    idActivity: String(idActivity),
    idTopic: String(idTopic),
    levelId: levelInfo.levelId != null ? String(levelInfo.levelId) : null,
    levelName: levelInfo.levelName || null,
    levelValue: levelInfo.levelValue != null ? Number(levelInfo.levelValue) : null,
  }
}

export const getLastClientEvaluationSnapshot = async ({ idClient, idActivity, ctxOverride = null }) => {
  if (!idClient || !idActivity) return null

  const db = getDb()
  const ctx = getContext(ctxOverride)

  const col = clientsEvaluationCol(db, ctx, idClient)
  const q = query(
    col,
    where("idActivity", "==", String(idActivity)),
    orderBy("createdAt", "desc"),
    limit(1)
  )

  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const data = d.data() || {}
  return { id: d.id, ...data }
}

export const getClientEvaluations = async ({ idClient, ctxOverride = null }) => {
  if (!idClient) return []

  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = clientsEvaluationCol(db, ctx, idClient)
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")))

  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientEvaluationByEvent = async ({ idClient, eventPlanId, ctxOverride = null }) => {
  if (!idClient || !eventPlanId) return null

  const db = getDb()
  const ctx = getContext(ctxOverride)

  const col = clientsEvaluationCol(db, ctx, idClient)
  const q = query(
    col,
    where("eventPlanId", "==", String(eventPlanId)),
    limit(1)
  )

  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export const updateClientEvaluation = async (id, idClient, data, { ctxOverride = null } = {}) => {
  if (!id || !idClient) throw new Error("ID da avaliação e ID do cliente são obrigatórios")

  const ctx = getContext(ctxOverride)


  // REFACTOR: Use Cloud Function for Update
  // const payload = makeUpdatePayload(data)
  // await updateDoc(ref, payload)
  // return { id, ...payload }

  const { getFirebaseFunctions } = require("../../helpers/firebase_helper");
  const { httpsCallable } = require("firebase/functions");

  const functions = getFirebaseFunctions();
  const saveFunc = httpsCallable(functions, "saveEvaluation");

  const result = await saveFunc({
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,
    idClient: String(idClient),
    idEvaluation: id,
    action: "update",
    payload: data
  });

  return result.data;
}

const clientsEvaluationService = {
  createClientEvaluation,
  updateClientEvaluation,
  getLastClientEvaluation,
  getLastClientEvaluationSnapshot,
  getClientEvaluations,
  getClientEvaluationByEvent,
}

export default clientsEvaluationService
