import { formatCurrency, calculateDelta, calculatePercent, calculateAverage } from "@pga/shared"

// Re-export for compatibility
export { formatCurrency, calculatePercent, calculateAverage }

// Aliases para manter compatibilidade com código existente
export const formatDelta = calculateDelta
export const calculateChurnPercent = calculatePercent
