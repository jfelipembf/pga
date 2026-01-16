import {
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { cashierSessionsCol, getContext, getDb } from "./financial.repository"

export const checkCashierStatus = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const col = cashierSessionsCol(db, ctx)

  // Busca a última sessão aberta ou a última fechada para mostrar info
  const q = query(col, orderBy("openedAt", "desc"), limit(1))
  const snap = await getDocs(q)

  if (snap.empty) {
    return { isOpen: false, session: null }
  }

  const lastSession = { id: snap.docs[0].id, ...snap.docs[0].data() }
  const isOpen = lastSession.status === "open"

  return { isOpen, session: lastSession }
}

export const openCashier = async ({ openingBalance }) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const openCashierFn = httpsCallable(functions, 'openCashier')

  try {
    const result = await openCashierFn({
      idTenant,
      idBranch,
      openingBalance
    })
    return result.data
  } catch (error) {
    console.error("Erro ao abrir caixa via função:", error)
    throw error
  }
}

export const closeCashier = async ({ idSession, closingBalance, observations }) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const closeCashierFn = httpsCallable(functions, 'closeCashier')

  try {
    const result = await closeCashierFn({
      idTenant,
      idBranch,
      idSession,
      closingBalance,
      observations
    })
    return result.data
  } catch (error) {
    console.error("Erro ao fechar caixa via função:", error)
    throw error
  }
}
