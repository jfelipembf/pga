// src/services/_core/db.js
import { getFirebaseDb } from "../../helpers/firebase_helper"

/**
 * Obtém a instância do Firestore.
 * Fonte única de verdade: firebase_helper.js
 */
export const getDb = () => {
  const db = getFirebaseDb()
  if (!db) {
    console.warn("Firestore não inicializado no firebase_helper")
    return null
  }
  return db
}

export const requireDb = () => {
  const db = getDb()
  if (!db) throw new Error("Firestore não inicializado")
  return db
}
