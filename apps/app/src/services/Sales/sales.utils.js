// src/services/sales/sales.utils.js
// @ts-check

import { detectSaleType } from "@pga/shared"
import { timestampToMillis } from "../_core/timestamp"

/** Para ordenar lista: prioriza saleDate, senão createdAt */
export const getSaleSortTime = s => {
  if (s?.saleDate) return new Date(s.saleDate).getTime()
  return timestampToMillis(s?.createdAt)
}

// Re-export para manter compatibilidade
export { detectSaleType }
