// src/services/_core/batch.js
import { writeBatch } from "firebase/firestore"

/**
 * Runner simples para writeBatch com commit automático por limite de operações.
 * Limite do Firestore é 500 ops por batch; usamos 450 por margem.
 */
export const createBatchRunner = (db, { maxOps = 450 } = {}) => {
  if (!db) throw new Error("db é obrigatório")

  let batch = writeBatch(db)
  let ops = 0

  const commitIfNeeded = async () => {
    if (ops >= maxOps) {
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
    }
  }

  const set = async (ref, data, options) => {
    batch.set(ref, data, options)
    ops += 1
    await commitIfNeeded()
  }

  const update = async (ref, data) => {
    batch.update(ref, data)
    ops += 1
    await commitIfNeeded()
  }

  const del = async ref => {
    batch.delete(ref)
    ops += 1
    await commitIfNeeded()
  }

  const commit = async () => {
    if (ops > 0) await batch.commit()
    ops = 0
  }

  return { set, update, del, commit }
}
