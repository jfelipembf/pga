import { addDoc, deleteDoc, getDocs, updateDoc } from "firebase/firestore"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"
import { mapFirestoreDocsIdLast } from "../_core/mappers"
import { acquirersCol, acquirerDoc, getContext, getDb } from "./acquirers.repository"

export const listAcquirers = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirersCol(db, ctx)
  const snap = await getDocs(ref)
  return mapFirestoreDocsIdLast(snap)
}

export const createAcquirer = async (data, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirersCol(db, ctx)
  const { id: _, ...rest } = data
  const payload = makeCreatePayload(rest, ctx)

  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const updateAcquirer = async (id, data, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("Missing id")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = acquirerDoc(db, ctx, id)
  const { id: _, ...rest } = data
  const payload = makeUpdatePayload(rest)

  await updateDoc(ref, payload)
  return { id, ...payload }
}

export const saveAcquirer = async (data, options) => {
  const id = data?.id
  if (id && !id.toString().startsWith('acquirer-')) {
    return updateAcquirer(id, data, options)
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
