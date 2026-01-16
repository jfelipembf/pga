// src/services/sales/sales.service.js
// @ts-check

import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

import { getSaleSortTime } from "./sales.utils"
import { salesCollectionRef, saleDocRef, saleItemsRef } from "./sales.repository"
import { buildSalePayload } from "../payloads"

/** ========= LISTAS ========= */

export const listSales = async () => {
  const db = requireDb()
  const ctx = requireBranchContext()
  const ref = salesCollectionRef(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const listSalesByClient = async clientId => {
  if (!clientId) return []
  const db = requireDb()
  const ctx = requireBranchContext()

  const ref = salesCollectionRef(db, ctx)
  const q = query(ref, where("idClient", "==", clientId))
  const snap = await getDocs(q)

  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  rows.sort((a, b) => getSaleSortTime(b) - getSaleSortTime(a))
  return rows
}

/** ========= GET (com subcoleções opcionais) ========= */

export const getSale = async (idSale, { withItems = false } = {}) => {
  if (!idSale) return null

  const db = requireDb()
  const ctx = requireBranchContext()

  const ref = saleDocRef(db, ctx, idSale)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  const base = { id: snap.id, ...snap.data() }

  const loadSub = async subName => {
    const subRef = doc(ref, "_").parent // só pra evitar linter chato (não usa)
    void subRef
    const col = (await import("firebase/firestore")).collection(ref, subName)
    const subSnap = await getDocs(col)
    return subSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  const [items] = await Promise.all([
    withItems ? loadSub("items") : Promise.resolve(undefined),
  ])

  return { ...base, items }
}

/** ========= CREATE / UPSERT =========
 * Regra:
 * - se idSale NÃO for passado: cria doc novo e cria subcoleções
 * - se idSale FOR passado: faz upsert do doc base e SUBSTITUI items/receivables para não duplicar
 */
export const createSale = async (data = {}, idSale) => {
  const functions = requireFunctions()
  const ctx = requireBranchContext() // Garante que temos contexto

  const createSaleFn = httpsCallable(functions, 'createSale')

  // ...

  try {
    const payload = buildSalePayload(data)
    const result = await createSaleFn({
      ...payload,
      items: data.items,
      payments: data.payments,
      totals: data.totals,
      dueDate: data.dueDate,
      idSale, // Se undefined, backend cria novo
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao criar/atualizar venda via função:", error)
    throw error
  }
}

export const listSaleItems = async idSale => {
  if (!idSale) return []
  const db = requireDb()
  const ctx = requireBranchContext()

  const saleRef = saleDocRef(db, ctx, idSale)
  const itemsRef = saleItemsRef(saleRef)
  const snap = await getDocs(itemsRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
