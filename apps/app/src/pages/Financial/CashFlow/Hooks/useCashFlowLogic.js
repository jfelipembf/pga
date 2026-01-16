import { useState, useCallback } from "react"
import { useLoading } from "../../../../hooks/useLoading"
import { getAuthBranchContext } from "../../../../services/Summary/index"
import { listFinancialTransactions } from "../../../../services/Financial/index"

import { toLocalISODate } from "../../Cashier/Utils/cashierUtils"

export const useCashFlowLogic = () => {
    const { isLoading, withLoading } = useLoading()
    const [dateRange, setDateRange] = useState([null, null])
    const [startDate, endDate] = dateRange
    const [transactions, setTransactions] = useState([])
    const [summary, setSummary] = useState([])
    const [chartData, setChartData] = useState({ categories: [], series: [] })

    const loadData = useCallback(async () => {
        const ctx = getAuthBranchContext()
        if (!ctx?.idTenant || !ctx?.idBranch) return

        try {
            await withLoading('page', async () => {
                const rangeStart = startDate || endDate || null
                const rangeEnd = endDate || startDate || null

                const queryParams = { limit: 1000 }

                if (rangeStart || rangeEnd) {
                    queryParams.dateRange = {
                        start: toLocalISODate(rangeStart),
                        end: toLocalISODate(rangeEnd)
                    }
                }

                // Fetch financial transactions
                const txs = await listFinancialTransactions(queryParams)
                setTransactions(Array.isArray(txs) ? txs : [])

                // Consolidate by month for chart
                const monthlyMap = {}
                const safeTxs = Array.isArray(txs) ? txs : []
                safeTxs.forEach(tx => {
                    if (!tx.date) return
                    const monthId = tx.date.slice(0, 7)
                    monthlyMap[monthId] = monthlyMap[monthId] || { revenue: 0, expenses: 0 }
                    const amt = Number(tx.amount || 0)
                    if (tx.type === "sale") monthlyMap[monthId].revenue += amt
                    else monthlyMap[monthId].expenses += amt
                })

                const months = Object.keys(monthlyMap).sort()
                const categories = months
                const revenues = months.map(m => monthlyMap[m].revenue)
                const expenses = months.map(m => monthlyMap[m].expenses)
                const balances = months.map((m, idx) => revenues[idx] - expenses[idx])

                setChartData({
                    categories,
                    series: [
                        { name: "Receitas", data: revenues },
                        { name: "Despesas", data: expenses },
                        { name: "Saldo", data: balances },
                    ],
                })

                // Period summary
                const revenueTotal = revenues.reduce((a, b) => a + b, 0)
                const expenseTotal = expenses.reduce((a, b) => a + b, 0)
                setSummary([
                    { id: "rev", label: "Receitas", color: "success", value: revenueTotal },
                    { id: "exp", label: "Despesas", color: "danger", value: expenseTotal },
                    { id: "bal", label: "Saldo", color: "primary", value: revenueTotal - expenseTotal },
                ])
            })
        } catch (err) {
            console.error("Erro ao carregar fluxo de caixa", err)
        }
    }, [startDate, endDate, withLoading])

    return {
        isLoading,
        dateRange,
        setDateRange,
        startDate,
        endDate,
        transactions,
        summary,
        chartData,
        loadData
    }
}
