export const parseDate = dateStr => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d)
}
