// src/services/activities/activities.import.service.js

import { addDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { branchCollection, branchDoc } from "../_core/refs"
import { newId } from "../_core/ids"

/**
 * Importa atividades com objetivos e tópicos.
 * - Activity: gera ID novo (addDoc)
 * - Objective/Topic: preserva o id se vier no payload; senão gera.
 */
export const importActivitiesWithObjectives = async (activities, { ctxOverride = null } = {}) => {
  if (!Array.isArray(activities) || activities.length === 0) return []

  const db = requireDb()
  const ctx = requireBranchContext(ctxOverride)

  const created = []

  for (const activity of activities) {
    const actPayload = {
      name: activity.name || "Atividade",
      description: activity.description || "",
      color: activity.color || "#3c5068",
      status: activity.status || "active",
      shareWithOtherUnits: Boolean(activity.shareWithOtherUnits),

      idStaff: activity.idStaff || activity.idInstructor || activity.instructorId || null,
      instructor: activity.instructor || null,

      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,

      deleted: Boolean(activity.deleted) || false,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const actRef = await addDoc(branchCollection(db, ctx, "activities"), actPayload)
    const idActivity = actRef.id

    const objectives = Array.isArray(activity.objectives) ? activity.objectives : []
    for (let i = 0; i < objectives.length; i += 1) {
      const obj = objectives[i]
      const objId = obj.id || newId(db, "obj")

      const objRef = branchDoc(db, ctx, "activities", idActivity, "objectives", objId)
      const objPayload = {
        id: objId,
        idActivity,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch,

        title: obj.title || "",
        order: Number(obj.order || i + 1),
        deleted: Boolean(obj.deleted) || false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(objRef, objPayload, { merge: true })

      const topics = Array.isArray(obj.topics) ? obj.topics : []
      for (let j = 0; j < topics.length; j += 1) {
        const topic = topics[j]
        const topicId = topic.id || newId(db, "topic")

        const topicRef = branchDoc(db, ctx, "activities", idActivity, "objectives", objId, "topics", topicId)

        const topicPayload = {
          id: topicId,
          idActivity,
          idObjective: objId,
          idTenant: ctx.idTenant,
          idBranch: ctx.idBranch,

          description: topic.description || "",
          order: Number(topic.order || j + 1),
          deleted: Boolean(topic.deleted) || false,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        await setDoc(topicRef, topicPayload, { merge: true })
      }
    }

    created.push({ id: idActivity, ...actPayload })
  }

  return created
}
