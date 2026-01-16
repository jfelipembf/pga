import { addDoc, deleteDoc, getDocs, updateDoc } from "firebase/firestore"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"
import { acquirersCol, acquirerDoc, getContext, getDb } from "./acquirers.repository"

export const listAcquirers = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirersCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createAcquirer = async (data, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirersCol(db, ctx)
  const payload = makeCreatePayload(data, ctx)

  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const updateAcquirer = async (id, data, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("Missing id")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirerDoc(db, ctx, id)
  const payload = makeUpdatePayload(data)

  await updateDoc(ref, payload)
  return { id, ...payload }
}

export const saveAcquirer = async (data, options) => {
  // Check if document actually exists in Firestore
  if (data?.id && !data.id.startsWith('acquirer-')) {
    return updateAcquirer(data.id, data, options)
  }
  return createAcquirer(data, options)
}

export const deleteAcquirer = async (id, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("Missing id")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirerDoc(db, ctx, id)
  await deleteDoc(ref)
  return true
}
