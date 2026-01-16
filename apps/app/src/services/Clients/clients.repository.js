// src/services/clients/clients.repository.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  documentId,
} from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

export const getContext = (override) => {
  if (override) return override
  return requireBranchContext()
}

export const clientsCol = (db, ctx) => collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients")
export const clientDoc = (db, ctx, idClient) => doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", idClient)

export const listClientsRepo = async (ctxOverride = null) => {
  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = clientsCol(db, ctx)
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")))

  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const listClientsByIdsRepo = async (clientIds, ctxOverride = null) => {
  const ids = Array.isArray(clientIds) ? [...new Set(clientIds.filter(Boolean).map(String))] : []
  if (!ids.length) return []

  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = clientsCol(db, ctx)
  const out = []

  // Firestore "in" suporta até 10 valores
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10)
    const snap = await getDocs(query(ref, where(documentId(), "in", chunk)))
    out.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  return out
}

export const getClientRepo = async (idClient, ctxOverride = null) => {
  if (!idClient) return null

  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = clientDoc(db, ctx, idClient)
  const snap = await getDoc(ref)

  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const createClientRepo = async (payload, ctxOverride = null) => {
  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = clientsCol(db, ctx)
  const docRef = await addDoc(ref, {
    ...payload,
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export const updateClientRepo = async (idClient, data, ctxOverride = null) => {
  if (!idClient) throw new Error("idClient é obrigatório")

  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = clientDoc(db, ctx, idClient)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })

  return true
}

/**
 * Subcoleções do cliente (avaliations/tests/presences etc).
 * Mantemos aqui porque ainda ficam “dentro do cliente”.
 */
export const listClientSubcollectionRepo = async (idClient, subName, ctxOverride = null) => {
  if (!idClient || !subName) return []

  const db = requireDb()
  const ctx = ctxOverride || getContext()

  const ref = collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", idClient, subName)
  const snap = await getDocs(ref)

  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
