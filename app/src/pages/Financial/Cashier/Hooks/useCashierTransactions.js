import { useState, useCallback, useMemo, useEffect } from "react"
import { useToast } from "../../../../components/Common/ToastProvider"
import { toLocalISODate, getTxDate } from "../Utils/cashierUtils"
import {
    getTodayTransactions,
    listFinancialTransactions,
} from "../../../../services/Financial/index"

export const useCashierTransactions = ({ withLoading }) => {
    const toast = useToast()

    const [transactions, setTransactions] = useState([])
    const [dateRange, setDateRange] = useState([null, null])
    const [startDate, endDate] = dateRange
    const [isPrinting, setIsPrinting] = useState(false)

    const hasRange = Boolean(startDate || endDate)
    const rangeStart = startDate || endDate || null
    const rangeEnd = endDate || startDate || null

    const loadTransactions = useCallback(async () => {
        try {
            const fetchFn = async () => {
                let txs = []

                if (hasRange) {
                    const start = toLocalISODate(rangeStart)
                    const end = toLocalISODate(rangeEnd)

                    txs = await listFinancialTransactions({
                        dateRange: { start, end },
                        limit: 500,
                    })
                } else {
                    txs = await getTodayTransactions()
                }

                setTransactions(Array.isArray(txs) ? txs : [])
            }

            if (withLoading) await withLoading("page", fetchFn)
            else await fetchFn()
        } catch (error) {
            console.error("Erro ao carregar transações", error)
            setTransactions([])
            toast.show({ title: "Erro ao carregar transações", color: "danger" })
        }
    }, [withLoading, toast, hasRange, rangeStart, rangeEnd])

    // PRINT
    useEffect(() => {
        if (!isPrinting) return
        const t = setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 50)
        return () => clearTimeout(t)
    }, [isPrinting])

    const filteredTransactions = useMemo(() => {
        if (!Array.isArray(transactions)) return []

        if (!hasRange) {
            return transactions
        }

        const start = rangeStart ? new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 0, 0, 0, 0) : null
        const end = rangeEnd ? new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999) : null

        return transactions.filter((tx) => {
            const d = getTxDate(tx)
            if (!d) return false
            if (start && d < start) return false
            if (end && d > end) return false
            return true
        })
    }, [transactions, hasRange, rangeStart, rangeEnd])

    const totals = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, tx) => {
                const amt = Number(tx.amount || 0)
                const isSale = tx.type === "sale" || tx.kind === "sale" || tx.direction === "in"
                if (isSale) acc.revenue += amt
                else acc.expenses += amt
                return acc
            },
            { revenue: 0, expenses: 0 }
        )
    }, [filteredTransactions])

    return {
        transactions,
        dateRange,
        setDateRange,
        startDate,
        endDate,
        loadTransactions,
        filteredTransactions,
        totals,
        isPrinting,
        setIsPrinting
    }
}
