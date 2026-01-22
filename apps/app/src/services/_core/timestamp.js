// src/services/_core/timestamp.js

/**
 * Utilitários centralizados para conversão de Firestore Timestamps.
 * Use estas funções ao invés de implementar conversões inline.
 */

/**
 * Converte Firestore Timestamp para Date JavaScript.
 * Lida com múltiplos formatos de entrada.
 * 
 * @param {*} timestamp - Firestore Timestamp, Date, ou string
 * @returns {Date|null} - Date object ou null se inválido
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate()
  if (typeof timestamp?.seconds === 'number') return new Date(timestamp.seconds * 1000)
  
  // Tenta converter string ou número
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Converte Firestore Timestamp para milissegundos.
 * Útil para comparações e ordenação.
 * 
 * @param {*} timestamp - Firestore Timestamp, Date, ou string
 * @returns {number} - Milissegundos desde epoch, ou 0 se inválido
 */
export const timestampToMillis = (timestamp) => {
  if (!timestamp) return 0
  if (typeof timestamp?.toMillis === 'function') return timestamp.toMillis()
  if (timestamp instanceof Date) return timestamp.getTime()
  if (typeof timestamp?.seconds === 'number') return timestamp.seconds * 1000
  
  // Tenta converter
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

/**
 * Compara dois timestamps.
 * Útil para funções de ordenação.
 * 
 * @param {*} a - Primeiro timestamp
 * @param {*} b - Segundo timestamp
 * @param {boolean} desc - Se true, ordem decrescente (padrão: true)
 * @returns {number} - Resultado da comparação (-1, 0, 1)
 */
export const compareTimestamps = (a, b, desc = true) => {
  const aMs = timestampToMillis(a)
  const bMs = timestampToMillis(b)
  return desc ? bMs - aMs : aMs - bMs
}

/**
 * Cria uma função comparadora para usar com Array.sort().
 * 
 * @param {string} field - Nome do campo a comparar
 * @param {boolean} desc - Se true, ordem decrescente (padrão: true)
 * @returns {Function} - Função comparadora
 * 
 * @example
 * const sorted = items.sort(timestampComparator('createdAt'))
 */
export const timestampComparator = (field = 'createdAt', desc = true) => {
  return (a, b) => compareTimestamps(a[field], b[field], desc)
}
