// src/services/sales/sales.utils.js
// @ts-check

import { detectSaleType } from "@pga/shared"

/** Para ordenar lista: prioriza saleDate, senão createdAt */
export const getSaleSortTime = s => {
  if (s?.saleDate) return new Date(s.saleDate).getTime()
  if (s?.createdAt?.toMillis) return s.createdAt.toMillis()
  return 0
}

// Re-export para manter compatibilidade
export { detectSaleType }
