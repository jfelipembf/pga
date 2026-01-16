import { registerLocale } from "react-datepicker"
import ptBR from "date-fns/locale/pt-BR"

registerLocale("pt-BR", ptBR)

export const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        Number(value || 0)
    )

/**
 * Converte Date -> "YYYY-MM-DD" em horário local (não UTC)
 */
export const toLocalISODate = (d) => {
    if (!d) return null
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

/**
 * Tenta extrair uma data (Date) da transação.
 */
export const getTxDate = (tx) => {
    if (!tx) return null

    // 1) Campo "date" no formato "YYYY-MM-DD"
    if (typeof tx.date === "string") {
        const m = tx.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (m) {
            const y = Number(m[1])
            const mo = Number(m[2]) - 1
            const d = Number(m[3])
            return new Date(y, mo, d) // local midnight
        }
    }

    // 2) "date" como Date
    if (tx.date instanceof Date && !Number.isNaN(tx.date.getTime())) return tx.date

    // 3) "date" como Timestamp do Firestore
    if (tx.date?.toDate) {
        const d = tx.date.toDate()
        if (d instanceof Date && !Number.isNaN(d.getTime())) return d
    }

    // 4) fallback para campos comuns
    const candidates = [tx.createdAt, tx.paidAt, tx.created_at, tx.updatedAt]
    for (const c of candidates) {
        if (!c) continue
        if (c?.toDate) {
            const d = c.toDate()
            if (d instanceof Date && !Number.isNaN(d.getTime())) return d
        }
        if (c instanceof Date && !Number.isNaN(c.getTime())) return c
        const parsed = new Date(c)
        if (!Number.isNaN(parsed.getTime())) return parsed
    }

    return null
}

export const formatDateTime = (val) => {
    if (!val) return "--"
    const date = val?.toDate ? val.toDate() : new Date(val)
    if (Number.isNaN(date.getTime())) return "--"
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}
