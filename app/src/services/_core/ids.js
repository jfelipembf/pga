// src/services/_core/ids.js
import { collection, doc } from "firebase/firestore"

/**
 * Gera um id seguro:
 * - preferencial: crypto.randomUUID()
 * - fallback: doc(collection(db,"__tmp__")).id (sem gravar nada)
 */
export const newId = (db, prefix = "") => {
  let id = null

  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID()
    }
  } catch {
    // ignore
  }

  if (!id) {
    if (!db) throw new Error("db é obrigatório para fallback de id")
    id = doc(collection(db, "__tmp__")).id
  }

  return prefix ? `${prefix}-${id}` : id
}
