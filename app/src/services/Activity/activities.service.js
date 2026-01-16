// src/services/activities/activities.service.js

import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch, // IMPORTED HERE
} from "firebase/firestore"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"

import { activitiesCol, activityDoc } from "./activities.repository"
import { buildActivityPayload } from "../payloads"
import { listObjectivesWithTopics } from "./activities.objectives.service"

const mapDoc = d => ({ id: d.id, ...d.data() })

/** ===========================
 * READ
 * =========================== */

export const listActivities = async ({ ctxOverride = null } = {}) => {
  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activitiesCol(db, ctx)
  // FIX: Remove orderBy("order") because it hides docs without this field
  const snap = await getDocs(query(col))

  const docs = snap.docs.map(mapDoc).filter(a => !a?.deleted)
  // Sort in memory: items with 'order' first, then by name
  return docs.sort((a, b) => {
    const orderA = a.order ?? 9999
    const orderB = b.order ?? 9999
    if (orderA !== orderB) return orderA - orderB
    return (a.name || "").localeCompare(b.name || "")
  })
}

export const getActivity = async (idActivity, { ctxOverride = null } = {}) => {
  if (!idActivity) return null

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const ref = activityDoc(db, ctx, idActivity)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  const act = { id: snap.id, ...snap.data() }
  return act?.deleted ? null : act
}

/**
 * Lista atividades e carrega objectives e topics aninhados.
 * (Consulta pesada: 1 + N + (N*M). Use apenas quando precisar.)
 */
export const listActivitiesWithObjectives = async ({ ctxOverride = null } = {}) => {
  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activitiesCol(db, ctx)
  // FIX: Remove orderBy("order") because it hides docs without this field
  const actsSnap = await getDocs(query(col))

  const activities = await Promise.all(
    actsSnap.docs.map(async docAct => {
      const act = { id: docAct.id, ...docAct.data() }
      if (act.deleted) return null

      const objectives = await listObjectivesWithTopics(act.id, { ctxOverride: ctx })
      return { ...act, objectives }
    })
  )

  const filtered = activities.filter(Boolean)

  // Sort in memory
  return filtered.sort((a, b) => {
    const orderA = a.order ?? 9999
    const orderB = b.order ?? 9999
    if (orderA !== orderB) return orderA - orderB
    return (a.name || "").localeCompare(b.name || "")
  })
}

/** ===========================
 * WRITE
 * =========================== */

export const createActivity = async (data = {}, { ctxOverride = null } = {}) => {
  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const col = activitiesCol(db, ctx)

  const normalized = buildActivityPayload(data)
  const payload = makeCreatePayload(normalized, ctx)

  const docRef = await addDoc(col, payload)
  return { id: docRef.id, ...payload }
}

export const updateActivity = async (idActivity, data = {}, { ctxOverride = null } = {}) => {
  if (!idActivity) throw new Error("ID da atividade não informado")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const ref = activityDoc(db, ctx, idActivity)

  const payload = makeUpdatePayload(
    {
      ...data,
      // normaliza também no update (se vierem)
      ...(data.idStaff !== undefined && { idStaff: data.idStaff || null }),
      ...(data.instructor !== undefined && { instructor: data.instructor || null }),
    },
    { updatedAt: serverTimestamp() }
  )

  // Remove any remaining undefined fields that might have come from ...data
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  await updateDoc(ref, payload)
  return { id: idActivity, ...payload }
}

/**
 * Soft delete (padrão). Se quiser hard delete, passe { hard: true }.
 */
export const deleteActivity = async (idActivity, { ctxOverride = null, hard = false } = {}) => {
  if (!idActivity) throw new Error("ID da atividade não informado")

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const ref = activityDoc(db, ctx, idActivity)

  if (hard) {
    await deleteDoc(ref)
    return true
  }

  await updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() })
  return true
}
/**
 * Reordena atividades em lote usando Batch Write.
 * Recebe array de IDs na ordem desejada.
 */
export const reorderActivities = async (orderedIds, { ctxOverride = null } = {}) => {
  if (!orderedIds?.length) return

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const batch = writeBatch(db)

  orderedIds.forEach((id, index) => {
    const ref = activityDoc(db, ctx, id)
    // Update order field (index + 1 so it starts at 1)
    batch.update(ref, { order: index + 1, updatedAt: serverTimestamp() })
  })

  await batch.commit()
}
