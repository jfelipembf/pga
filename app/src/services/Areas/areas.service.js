import { addDoc, getDocs } from "firebase/firestore"
import { makeCreatePayload } from "../_core/payload"
import { areasCol, getContext, getDb } from "./areas.repository"

export const listAreas = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = areasCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createArea = async (data, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = areasCol(db, ctx)
  const payload = makeCreatePayload(data, ctx)
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}
