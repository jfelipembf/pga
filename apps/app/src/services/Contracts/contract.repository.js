// src/services/contract/contract.repository.js

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { requireBranchContext } from "../_core/context"
import { requireDb } from "../_core/db"

/**
 * CONTRACT (catálogo / produto / plano)
 * Collection: tenants/{idTenant}/branches/{idBranch}/contracts
 *
 * - Isso NÃO é a relação com cliente (isso fica em clientContracts)
 */

export const contractsCol = (db, ctx) =>
  collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "contracts")

export const contractDoc = (db, ctx, id) =>
  doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "contracts", id)

export const getContext = (ctxOverride) => {
  if (ctxOverride) return ctxOverride
  return requireBranchContext()
}

export const getDb = () => requireDb()

export const listContracts = async (db, ctx) => {
  const ref = contractsCol(db, ctx)
  try {
    const snap = await getDocs(query(ref, orderBy("title", "asc")))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Erro ao listar contratos:", e)
    return []
  }
}

export const getContract = async (db, ctx, idContract) => {
  if (!idContract) return null
  const ref = contractDoc(db, ctx, idContract)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const createContract = async (db, ctx, data = {}) => {
  const ref = contractsCol(db, ctx)
  const payload = {
    ...data,
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const updateContract = async (db, ctx, idContract, data = {}) => {
  if (!idContract) throw new Error("idContract é obrigatório")
  const ref = contractDoc(db, ctx, idContract)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  return { id: idContract, ...data }
}
