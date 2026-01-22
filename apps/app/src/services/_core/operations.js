// src/services/_core/operations.js
import { updateDoc, serverTimestamp } from "firebase/firestore"

/**
 * Utilitários centralizados para operações comuns no Firestore.
 */

/**
 * Soft delete padrão - marca documento como deletado sem removê-lo.
 * 
 * @param {DocumentReference} docRef - Referência do documento
 * @returns {Promise<void>}
 */
export const softDelete = async (docRef) => {
  await updateDoc(docRef, { 
    deleted: true, 
    updatedAt: serverTimestamp() 
  })
}

/**
 * Restaura documento que foi soft deleted.
 * 
 * @param {DocumentReference} docRef - Referência do documento
 * @returns {Promise<void>}
 */
export const restoreDeleted = async (docRef) => {
  await updateDoc(docRef, { 
    deleted: false, 
    updatedAt: serverTimestamp() 
  })
}
