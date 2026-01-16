import { getDoc } from "firebase/firestore"
import { dailySummaryDoc, monthlySummaryDoc, getContext, getDb } from "./summary.repository"

/**
 * Lê dailySummary de uma unidade.
 * Retorna null se não existir ou se faltar dados.
 */
export const getDailySummary = async ({ idTenant, idBranch, dateStr, ctxOverride = null }) => {
  if (!dateStr) return null

  // Support explicit tenant/branch generic arguments or use context if not provided (though this function signature implies explicit args were standard)
  // To be standardized: if idTenant/idBranch are passed, we might need to mock a context or strict override.
  // But given standard refactoring, we should prefer context.
  // HOWEVER, previous code took idTenant/idBranch explicitly.
  // Let's support both: explicitly passed OR context.

  let db = getDb()
  // If idTenant/idBranch provided, construct a temp context, else use normal context
  let ctx
  if (idTenant && idBranch) {
    ctx = { idTenant: String(idTenant), idBranch: String(idBranch) }
  } else {
    ctx = getContext(ctxOverride)
  }

  const ref = dailySummaryDoc(db, ctx, dateStr)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Lê monthlySummary de uma unidade.
 */
export const getMonthlySummary = async ({ idTenant, idBranch, monthId, ctxOverride = null }) => {
  if (!monthId) return null

  let db = getDb()
  let ctx
  if (idTenant && idBranch) {
    ctx = { idTenant: String(idTenant), idBranch: String(idBranch) }
  } else {
    ctx = getContext(ctxOverride)
  }

  const ref = monthlySummaryDoc(db, ctx, monthId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
