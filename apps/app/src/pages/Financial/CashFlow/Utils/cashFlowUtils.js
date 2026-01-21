import { formatCurrency, formatDate } from "@pga/shared"

export { formatCurrency }

export const formatRange = (start, end) => {
    if (!start) return "Todos os períodos"
    const startStr = formatDate(start)
    const endStr = end ? formatDate(end) : "..."
    return `${startStr} - ${endStr}`
}
