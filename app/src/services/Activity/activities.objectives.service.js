// src/services/activities/activities.objectives.service.js

import { deleteDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { newId } from "../_core/ids"

import {
  activityObjectivesCol,
  activityObjectiveDoc,
  activityTopicsCol,
  activityTopicDoc,
} from "./activities.repository"

const mapDoc = d => ({ id: d.id, ...d.data() })

export const listObjectives = async (idActivity, { ctxOverride = null } = {}) => {
  if (!idActivity) return []

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activityObjectivesCol(db, ctx, idActivity)
  const snap = await getDocs(query(col, orderBy("order", "asc")))

  return snap.docs.map(mapDoc).filter(o => !o?.deleted)
}

export const listTopics = async (idActivity, idObjective, { ctxOverride = null } = {}) => {
  if (!idActivity || !idObjective) return []

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activityTopicsCol(db, ctx, idActivity, idObjective)
  const snap = await getDocs(query(col, orderBy("order", "asc")))

  return snap.docs.map(mapDoc).filter(t => !t?.deleted)
}

/**
 * Retorna objectives já com topics aninhados (para telas de edição/visualização).
 */
export const listObjectivesWithTopics = async (idActivity, { ctxOverride = null } = {}) => {
  if (!idActivity) return []

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activityObjectivesCol(db, ctx, idActivity)
  const objSnap = await getDocs(query(col, orderBy("order", "asc")))

  const objectives = await Promise.all(
    objSnap.docs.map(async objDoc => {
      const obj = mapDoc(objDoc)
      if (obj.deleted) return null

      const tCol = activityTopicsCol(db, ctx, idActivity, obj.id)
      const tSnap = await getDocs(query(tCol, orderBy("order", "asc")))
      const topics = tSnap.docs.map(mapDoc).filter(t => !t?.deleted)

      return { ...obj, topics }
    })
  )

  return objectives.filter(Boolean)
}

export const upsertObjective = async (idActivity, objective = {}, { ctxOverride = null } = {}) => {
  if (!idActivity) throw new Error("ID da atividade não informado")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const objId = objective.id || newId(db, "obj")
  const ref = activityObjectiveDoc(db, ctx, idActivity, objId)

  const payload = {
    id: objId,
    idActivity,
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,

    title: objective.title || "",
    order: Number(objective.order || 0),

    deleted: Boolean(objective.deleted) || false,

    createdAt: objective.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(ref, payload, { merge: true })
  return { id: objId, ...payload }
}

export const deleteObjective = async (idActivity, idObjective, { ctxOverride = null, hard = false } = {}) => {
  if (!idActivity || !idObjective) throw new Error("IDs não informados")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const ref = activityObjectiveDoc(db, ctx, idActivity, idObjective)

  if (hard) {
    await deleteDoc(ref)
    return true
  }

  await setDoc(ref, { deleted: true, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

export const upsertTopic = async (
  idActivity,
  idObjective,
  topic = {},
  { ctxOverride = null } = {}
) => {
  if (!idActivity || !idObjective) throw new Error("IDs não informados")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const topicId = topic.id || newId(db, "topic")
  const ref = activityTopicDoc(db, ctx, idActivity, idObjective, topicId)

  const payload = {
    id: topicId,
    idActivity,
    idObjective,
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,

    description: topic.description || "",
    order: Number(topic.order || 0),

    deleted: Boolean(topic.deleted) || false,

    createdAt: topic.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(ref, payload, { merge: true })
  return { id: topicId, ...payload }
}

export const deleteTopic = async (
  idActivity,
  idObjective,
  idTopic,
  { ctxOverride = null, hard = false } = {}
) => {
  if (!idActivity || !idObjective || !idTopic) throw new Error("IDs não informados")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const ref = activityTopicDoc(db, ctx, idActivity, idObjective, idTopic)

  if (hard) {
    await deleteDoc(ref)
    return true
  }

  await setDoc(ref, { deleted: true, updatedAt: serverTimestamp() }, { merge: true })
  return true
}
