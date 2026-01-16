// src/services/_core/context.js

/**
 * Resolver opcional para puxar contexto do Redux (sem acoplar services ao store).
 *
 * Exemplo (no bootstrap do app):
 *   import { setContextResolver } from "services/_core/context"
 *   setContextResolver(() => {
 *     const s = store.getState()
 *     return { idTenant: s.Tenant?.tenant?.idTenant, idBranch: s.Branch?.idBranch }
 *   })
 */
let contextResolver = null

export const setContextResolver = fn => {
  contextResolver = typeof fn === "function" ? fn : null
}

/**
 * Tenta obter idTenant/idBranch do localStorage:
 * - authUser (padrão)
 * - session-* (fallback)
 * - idBranch salvo separado (ex: branchSaga)
 */
export const getAuthBranchContext = () => {
  try {
    const branchFromLS = localStorage.getItem("idBranch") || null
    const tenantFromLS = localStorage.getItem("idTenant") || null
    const tenantSlugLS = localStorage.getItem("tenantSlug") || null
    const branchSlugLS = localStorage.getItem("branchSlug") || null

    const raw = localStorage.getItem("authUser")
    if (raw) {
      const data = JSON.parse(raw)
      const idTenant = data?.idTenant ? String(data.idTenant) : tenantFromLS
      const idBranch = data?.idBranch ? String(data.idBranch) : branchFromLS

      if (idTenant && idBranch) {
        return {
          idTenant,
          idBranch,
          tenantSlug: data?.tenantSlug || tenantSlugLS,
          branchSlug: data?.branchSlug || branchSlugLS,
        }
      }
    }

    const sessionKey = Object.keys(localStorage).find(k => k.startsWith("session-"))
    if (sessionKey) {
      const sessionRaw = localStorage.getItem(sessionKey)
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw)
        const idTenant = session?.idTenant ? String(session.idTenant) : tenantFromLS
        const idBranch = session?.idBranch ? String(session.idBranch) : branchFromLS
        if (idTenant && idBranch) {
          return {
            idTenant,
            idBranch,
            tenantSlug: session?.tenantSlug || tenantSlugLS,
            branchSlug: session?.branchSlug || branchSlugLS,
          }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Retorna { idTenant, idBranch } como strings.
 * Prioridade:
 * 1) override (passado pela chamada)
 * 2) resolver (redux)
 * 3) localStorage (authUser/session- + idBranch)
 */
export const requireBranchContext = (override = null) => {
  const overrideCtx = override && override?.idTenant && override?.idBranch ? override : null
  const resolvedCtx = contextResolver ? contextResolver() : null
  const resolverCtx = resolvedCtx?.idTenant && resolvedCtx?.idBranch ? resolvedCtx : null
  const ctx = overrideCtx || resolverCtx || getAuthBranchContext()

  if (!ctx?.idTenant || !ctx?.idBranch) {
    throw new Error("Contexto de tenant/unidade não encontrado")
  }

  return {
    idTenant: String(ctx.idTenant),
    idBranch: String(ctx.idBranch),
  }
}
