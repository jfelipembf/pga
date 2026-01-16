// src/services/clientContracts/clientContracts.service.js

import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"

import { buildClientContractPayload } from "../payloads"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

import {
  listClientContracts as repoListClientContracts,
  listClientContractsByClient as repoListClientContractsByClient,
  listContractSuspensions as repoListContractSuspensions,
} from "./clientContracts.repository"

import { logConversion } from "../Funnel/index"

const getContext = () => requireBranchContext()

/** ===== Lists ===== */

export const listClientContracts = async () => {
  const db = requireDb()
  const ctx = getContext()
  return await repoListClientContracts(db, ctx)
}

export const listClientContractsByClient = async idClient => {
  const db = requireDb()
  const ctx = getContext()
  return await repoListClientContractsByClient(db, ctx, idClient)
}

export const listContractSuspensions = async idClientContract => {
  const db = requireDb()
  const ctx = getContext()
  return await repoListContractSuspensions(db, ctx, idClientContract)
}


/** ===== Create ===== */

// ... imports

export const createClientContract = async data => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const createContractFn = httpsCallable(functions, 'createClientContract')

  try {
    const payload = buildClientContractPayload(data)
    const result = await createContractFn({
      ...payload,
      idTenant,
      idBranch
    })

    // [FUNNEL] Log Conversion
    if (result.data?.idClientContract) {
      logConversion(data.idClient, {
        saleId: data.idSale || null,
        contractId: result.data.idClientContract,
        salesRepId: data.sellerId || data.salesRepId || null, // Best guess provided naming conventions
        amount: data.amount || 0
      }).catch(err => console.warn('[Funnel] Failed to log conversion:', err))
    }

    return result.data

  } catch (error) {
    console.error("Erro ao criar contrato via função:", error)
    throw error
  }
}

/** ===== Suspensions ===== */

export const scheduleContractSuspension = async (data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'scheduleContractSuspension')

  try {
    const result = await fn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao suspender contrato via função:", error)
    throw error
  }
}

export const stopContractSuspension = async (data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'stopClientContractSuspension')

  try {
    const result = await fn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao interromper suspensão via função:", error)
    throw error
  }
}

/** ===== Cancel ===== */

export const cancelClientContract = async (data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'cancelClientContract')

  try {
    const result = await fn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao cancelar contrato via função:", error)
    throw error
  }
}
