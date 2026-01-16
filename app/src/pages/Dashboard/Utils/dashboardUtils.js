export const formatCurrency = value => {
    if (value === null || value === undefined) return "--"
    const num = Number(value)
    if (Number.isNaN(num)) return "--"
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
}

export const formatDelta = (current, previous) => {
    if (previous == null || previous === 0 || current == null) return "--"
    const diff = ((current - previous) / previous) * 100
    const rounded = Math.round(diff * 10) / 10
    return `${rounded > 0 ? "+" : ""}${rounded}%`
}

export const calculateChurnPercent = (churnCount, activeCount) => {
    if (!activeCount || activeCount === 0 || !churnCount) return null
    return ((churnCount / activeCount) * 100).toFixed(1)
}
