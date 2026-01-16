// src/services/_core/payload.js
import { serverTimestamp } from "firebase/firestore"

/**
 * Payload padronizado para criação.
 * Injeta idTenant/idBranch + createdAt/updatedAt.
 */
export const makeCreatePayload = (data = {}, ctx = null) => ({
  ...data,
  ...(ctx?.idTenant ? { idTenant: String(ctx.idTenant) } : {}),
  ...(ctx?.idBranch ? { idBranch: String(ctx.idBranch) } : {}),
  createdAt: data?.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp(),
})

/**
 * Payload padronizado para update.
 */
export const makeUpdatePayload = (data = {}) => ({
  ...data,
  updatedAt: serverTimestamp(),
})
