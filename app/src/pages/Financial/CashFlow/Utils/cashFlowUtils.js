export const formatCurrency = value =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

export const formatRange = (start, end) => {
    if (!start) return "Todos os períodos"
    const opts = { day: "2-digit", month: "2-digit", year: "numeric" }
    const startStr = start.toLocaleDateString("pt-BR", opts)
    const endStr = end ? end.toLocaleDateString("pt-BR", opts) : "..."
    return `${startStr} - ${endStr}`
}
