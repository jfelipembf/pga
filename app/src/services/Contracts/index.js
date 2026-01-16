import { deleteDoc, getDocs, limit, query, where } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { clientContractsCollection } from "../ClientContracts/clientContracts.repository"
// Import writes from new service (Cloud Functions)
import { createContract as createContractService, updateContract as updateContractService } from "./contract.service"

import {
  contractDoc,
  getContext,
  getDb,
  getContract as getContractRepo,
  listContracts as listContractsRepo,
} from "./contract.repository"

export const listContracts = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  return await listContractsRepo(db, ctx)
}

export const getContract = async (idContract, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  return await getContractRepo(db, ctx, idContract)
}

// Writes: redirect to service (Cloud Functions)
export const createContract = async (data, { ctxOverride = null } = {}) => {
  return await createContractService(data)
}

export const updateContract = async (idContract, data, { ctxOverride = null } = {}) => {
  return await updateContractService(idContract, data)
}

export const deleteContract = async (idContract, { ctxOverride = null } = {}) => {
  if (!idContract) throw new Error("idContract é obrigatório")
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = contractDoc(db, ctx, idContract)
  await deleteDoc(ref)
  return true
}

/**
 * Verifica se existe algum clientContract usando este contrato (idContract).
 * Retorna true/false.
 */
export const contractHasUsage = async idContract => {
  if (!idContract) return false
  const db = requireDb()
  const ctx = getContext()

  const col = clientContractsCollection(db, ctx)
  const snap = await getDocs(query(col, where("idContract", "==", idContract), limit(1)))
  return !snap.empty
}
