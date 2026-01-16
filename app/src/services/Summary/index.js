// src/services/summary/index.js
import { getAuthBranchContext } from "../_core/context"

export { getAuthBranchContext } from "../_core/context"
export { getDailySummary, getMonthlySummary } from "./summary.read"

// Wrapper de compatibilidade
export const getContext = (override) => {
  if (override) return override
  return getAuthBranchContext()
}
