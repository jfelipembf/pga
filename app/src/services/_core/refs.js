// src/services/_core/refs.js
import { collection, doc } from "firebase/firestore"

/**
 * Monta collection ref no padrão:
 * tenants/{idTenant}/branches/{idBranch}/{...path}
 */
export const branchCollection = (db, ctx, ...path) => {
  if (!db) throw new Error("db não informado")
  if (!ctx?.idTenant || !ctx?.idBranch) throw new Error("ctx inválido")
  return collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, ...path)
}

/**
 * Monta doc ref no padrão:
 * tenants/{idTenant}/branches/{idBranch}/{...path}
 */
export const branchDoc = (db, ctx, ...path) => {
  if (!db) throw new Error("db não informado")
  if (!ctx?.idTenant || !ctx?.idBranch) throw new Error("ctx inválido")
  return doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, ...path)
}

/**
 * Subcoleção a partir de um docRef existente.
 */
export const subCollection = (parentDocRef, name) => {
  if (!parentDocRef) throw new Error("parentDocRef é obrigatório")
  if (!name) throw new Error("name é obrigatório")
  return collection(parentDocRef, name)
}
