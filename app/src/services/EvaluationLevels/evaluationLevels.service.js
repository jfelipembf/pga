import { getDocs, query, orderBy, getDoc, addDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"
import { evaluationLevelsCol, evaluationLevelDoc, getContext, getDb } from "./evaluationLevels.repository"

// Busca níveis de avaliação do banco de dados
export const listEvaluationLevels = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = evaluationLevelsCol(db, ctx)
  const q = query(ref, orderBy("value", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getEvaluationLevel = async (id, { ctxOverride = null } = {}) => {
  if (!id) return null
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const docRef = evaluationLevelDoc(db, ctx, id)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const createEvaluationLevel = async (data, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = evaluationLevelsCol(db, ctx)

  const payload = makeCreatePayload(data, ctx)

  const createdRef = await addDoc(ref, payload)
  // Alguns legados salvam o ID dentro do documento também
  await setDoc(evaluationLevelDoc(db, ctx, createdRef.id), { id: createdRef.id }, { merge: true })

  return { id: createdRef.id, ...payload }
}

export const updateEvaluationLevel = async (id, data, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("Missing id")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const docRef = evaluationLevelDoc(db, ctx, id)

  const payload = makeUpdatePayload({ ...data, id: String(id) })

  await updateDoc(docRef, payload)
  return { id: String(id), ...payload }
}

export const deleteEvaluationLevel = async (id, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("Missing id")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const docRef = evaluationLevelDoc(db, ctx, id)
  await deleteDoc(docRef)
  return true
}

// Salva ou atualiza um nível de avaliação
export const saveEvaluationLevel = async (id, data) => {
  if (id) return updateEvaluationLevel(id, data)
  return createEvaluationLevel(data)
}

const evaluationLevelsService = {
  listEvaluationLevels,
  getEvaluationLevel,
  createEvaluationLevel,
  updateEvaluationLevel,
  deleteEvaluationLevel,
  saveEvaluationLevel,
}

export default evaluationLevelsService
