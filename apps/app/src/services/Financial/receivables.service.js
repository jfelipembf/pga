import { getDocs, query, where } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { getDb } from "../_core/db"
import { requireFunctions } from "../_core/functions"
import { mapFirestoreDocsIdLast, mapFirestoreDocs } from "../_core/mappers"
import { receivablesCol, getContext } from "./receivables.repository"
import { buildReceivablePayload, toISODate } from "@pga/shared"

export const createReceivable = async data => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const addReceivableFn = httpsCallable(functions, 'addReceivable')

  try {
    const payload = buildReceivablePayload(data)
    const result = await addReceivableFn({
      ...payload,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao criar recebível via função:", error)
    throw error
  }
}

export const updateReceivable = async (idReceivable, data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'updateReceivable')

  try {
    const result = await fn({
      idReceivable,
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao atualizar recebível via função:", error)
    throw error
  }
}

export const markReceivablePaid = async (idReceivable, receivingDate) => {
  return updateReceivable(idReceivable, {
    status: "paid",
    receivingDate: receivingDate || toISODate(new Date()),
  })
}

export const cancelReceivable = async (idReceivable, reason = "Cancelamento manual") => {
  return updateReceivable(idReceivable, {
    status: "canceled",
    cancelReason: reason
    // canceledAt will be added by backend with FieldValue.serverTimestamp()
  })
}

export const deleteReceivable = async idReceivable => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'deleteReceivable')

  try {
    await fn({
      idReceivable,
      idTenant,
      idBranch
    })
    return true
  } catch (error) {
    console.error("Erro ao remover recebível via função:", error)
    throw error
  }
}

export const listReceivables = async ({ startDate, endDate, status, ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = receivablesCol(db, ctx)
  const snap = await getDocs(ref)
  let items = mapFirestoreDocsIdLast(snap)

  if (status) {
    items = items.filter(rcv => (rcv.status || "").toLowerCase() === status.toLowerCase())
  }
  if (startDate || endDate) {
    const start = startDate ? toISODate(startDate) : null
    const end = endDate ? toISODate(endDate) : start
    items = items.filter(rcv => {
      if (!rcv.dueDate) return false
      if (start && rcv.dueDate < start) return false
      if (end && rcv.dueDate > end) return false
      return true
    })
  }
  items.sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0
    return a.dueDate > b.dueDate ? -1 : 1
  })
  return items
}

export const listReceivablesBySale = async (idSale, { ctxOverride = null } = {}) => {
  if (!idSale) return []
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = receivablesCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => String(r.idSale || "") === String(idSale))
}

export const listReceivablesByClient = async (idClient, { status, ctxOverride = null } = {}) => {
  if (!idClient) return []
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = receivablesCol(db, ctx)

  let q = query(ref, where("idClient", "==", String(idClient)))
  if (status) {
    q = query(q, where("status", "==", status))
  }

  const snap = await getDocs(q)
  return mapFirestoreDocs(snap)
}

export const payReceivables = async (data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const fn = httpsCallable(functions, 'payReceivables')

  try {
    const result = await fn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao pagar receivables via função:", error)
    throw error
  }
}
