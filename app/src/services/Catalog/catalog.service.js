import { addDoc, deleteDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"
import {
  productsCol,
  productDoc,
  servicesCol,
  serviceDoc,
  getContext,
  getDb
} from "./catalog.repository"
import { buildServicePayload } from "../payloads"


/** PRODUCTS */

export const listProducts = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = productsCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createProduct = async (data, id = null, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const payload = makeCreatePayload(data, ctx)

  if (id) {
    const ref = productDoc(db, ctx, id)
    await setDoc(ref, payload, { merge: true })
    return { id: ref.id, ...payload }
  }

  const ref = productsCol(db, ctx)
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const updateProduct = async (id, data, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("id do produto é obrigatório")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = productDoc(db, ctx, id)
  const payload = makeUpdatePayload(data)

  await updateDoc(ref, payload)
  return { id, ...data }
}

export const deleteProduct = async (id, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("id do produto é obrigatório")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = productDoc(db, ctx, id)
  await deleteDoc(ref)
  return true
}

/** SERVICES */

export const listServices = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = servicesCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createService = async (data, id = null, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const serviceData = buildServicePayload(data)
  const payload = makeCreatePayload(serviceData, ctx)


  if (id) {
    const ref = serviceDoc(db, ctx, id)
    await setDoc(ref, payload, { merge: true })
    return { id: ref.id, ...payload }
  }

  const ref = servicesCol(db, ctx)
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const updateService = async (id, data, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("id do serviço é obrigatório")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = serviceDoc(db, ctx, id)
  const payload = makeUpdatePayload(data)

  await updateDoc(ref, payload)
  return { id, ...data }
}

export const deleteService = async (id, { ctxOverride = null } = {}) => {
  if (!id) throw new Error("id do serviço é obrigatório")
  const db = getDb()
  const ctx = getContext(ctxOverride)

  const ref = serviceDoc(db, ctx, id)
  await deleteDoc(ref)
  return true
}
