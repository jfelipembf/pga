import {
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { cashierSessionsCol, getContext, getDb } from "./financial.repository"

export const checkCashierStatus = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  // Need to get current user UID to filter sessions
  // Assuming getAuthUser helper is available or passed in ctx
  // For now, let's try to get from localStorage if not available in context
  let uid = null
  try {
    const stored = localStorage.getItem("authUser")
    if (stored) {
      uid = JSON.parse(stored).uid
    }
  } catch (e) { }

  if (!uid) return { isOpen: false, session: null }

  const col = cashierSessionsCol(db, ctx)

  // Busca a última sessão aberta ou a última fechada DESTE USUÁRIO
  const q = query(
    col,
    where("idStaff", "==", uid),
    orderBy("openedAt", "desc"),
    limit(1)
  )
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
