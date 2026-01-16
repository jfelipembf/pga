// src/services/_core/audit.js
// Helpers para padronizar audit fields (createdAt/updatedAt) e contexto (idTenant/idBranch)

import { serverTimestamp } from "firebase/firestore"

export const withAuditCreate = (data = {}, ctx = null) => ({
  ...data,
  ...(ctx?.idTenant ? { idTenant: String(ctx.idTenant) } : {}),
  ...(ctx?.idBranch ? { idBranch: String(ctx.idBranch) } : {}),
  createdAt: data?.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp(),
})

export const withAuditUpdate = (data = {}) => ({
  ...data,
  updatedAt: serverTimestamp(),
})
