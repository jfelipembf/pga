// src/services/_core/sorting.js
import { timestampToMillis, timestampComparator } from "./timestamp"

/**
 * Utilitários centralizados para ordenação de arrays.
 */

/**
 * Ordena array por campo de timestamp.
 * Retorna novo array (não modifica o original).
 * 
 * @param {Array} array - Array a ordenar
 * @param {string} field - Nome do campo timestamp (padrão: 'createdAt')
 * @param {boolean} desc - Se true, ordem decrescente (padrão: true)
 * @returns {Array} - Novo array ordenado
 * 
 * @example
 * const sorted = sortByTimestamp(items, 'updatedAt', false)
 */
export const sortByTimestamp = (array, field = 'createdAt', desc = true) => {
  if (!Array.isArray(array)) return []
  return [...array].sort(timestampComparator(field, desc))
}

/**
 * Ordena array por múltiplos campos.
 * 
 * @param {Array} array - Array a ordenar
 * @param {Array<{field: string, desc: boolean}>} fields - Campos e direções
 * @returns {Array} - Novo array ordenado
 * 
 * @example
 * const sorted = sortByMultipleFields(items, [
 *   { field: 'priority', desc: false },
 *   { field: 'createdAt', desc: true }
 * ])
 */
export const sortByMultipleFields = (array, fields) => {
  if (!Array.isArray(array) || !Array.isArray(fields)) return array
  
  return [...array].sort((a, b) => {
    for (const { field, desc = true } of fields) {
      const aVal = timestampToMillis(a[field])
      const bVal = timestampToMillis(b[field])
      const comparison = desc ? bVal - aVal : aVal - bVal
      if (comparison !== 0) return comparison
    }
    return 0
  })
}
