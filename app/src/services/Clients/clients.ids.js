// src/services/clients/clients.ids.js
import { doc, runTransaction } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

/**
 * Gera um idGym sequencial (0001, 0002...) por UNIDADE (branch).
 * Armazena em: tenants/{t}/branches/{b}/counters/clients
 */
export const getNextClientGymId = async (ctxOverride = null) => {
  const db = requireDb()
  const { idTenant, idBranch } = requireBranchContext(ctxOverride)

  const counterRef = doc(db, "tenants", idTenant, "branches", idBranch, "counters", "clients")

  const next = await runTransaction(db, async tx => {
    const snap = await tx.get(counterRef)
    const current = snap.exists() ? Number(snap.data()?.value || 0) : 0
    const value = current + 1
    tx.set(counterRef, { value }, { merge: true })
    return value
  })

  return String(next).padStart(4, "0")
}
