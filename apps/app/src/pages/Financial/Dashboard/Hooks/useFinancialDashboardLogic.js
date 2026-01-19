import { useState, useEffect, useMemo, useCallback } from "react"
import { useLoading } from "../../../../hooks/useLoading"
import { getAuthBranchContext, getMonthlySummary } from "../../../../services/Summary/index"
import { listFinancialTransactions } from "../../../../services/Financial/index"
import { formatCurrency, formatDelta } from "../../../Dashboard/Utils/dashboardUtils"

export const useFinancialDashboardLogic = () => {
    const { isLoading, withLoading } = useLoading()
    const [monthly, setMonthly] = useState(null)
    const [monthlyPrev, setMonthlyPrev] = useState(null)
    const [revenueHistory, setRevenueHistory] = useState([])
    const [forecast, setForecast] = useState([])

    const refreshData = useCallback(async () => {
        const ctx = getAuthBranchContext()
        if (!ctx?.idTenant || !ctx?.idBranch) return

        try {
            await withLoading('page', async () => {
                const today = new Date()
                const monthId = today.toISOString().slice(0, 7) // YYYY-MM

                const yesterday = new Date(today)
                yesterday.setDate(today.getDate() - 1)
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const prevMonthId = prevMonth.toISOString().slice(0, 7)

                // 1. Fetch Monthly Summaries (Current + Prev + History)
                const monthPromises = []
                for (let i = 0; i < 12; i++) {
                    const dt = new Date(today.getFullYear(), today.getMonth() - i, 1)
                    const id = dt.toISOString().slice(0, 7)
                    monthPromises.push(
                        getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId: id })
                            .then(res => ({ id, data: res || null }))
                    )
                }

                const [m, mPrev, ...mHistory] = await Promise.all([
                    getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId }),
                    getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId: prevMonthId }),
                    ...monthPromises
                ])

                const safeMonthly = m ? { id: m.id || monthId, ...m } : { id: monthId, salesMonth: 0, expenses: 0, totalRevenue: 0, grossRevenue: 0, totalFees: 0 }
                const safeMonthlyPrev = mPrev ? { id: mPrev.id || prevMonthId, ...mPrev } : { id: prevMonthId, salesMonth: 0, expenses: 0, totalRevenue: 0, grossRevenue: 0, totalFees: 0 }

                setMonthly(safeMonthly)
                setMonthlyPrev(safeMonthlyPrev)

                // Process History
                const historyData = mHistory
                    .map(entry => {
                        const d = entry.data || { salesMonth: 0, totalRevenue: 0, grossRevenue: 0 }
                        // Use grossRevenue (from transactions) for history matching the cards
                        // Fallback to salesMonth if grossRevenue is missing (older data compatibility)
                        const gross = d.grossRevenue || d.salesMonth || 0
                        const net = d.totalRevenue || gross // Default net to gross if missing

                        // Parse month label from ID
                        const [y, mm] = entry.id.split('-')
                        const date = new Date(Number(y), Number(mm) - 1, 1)
                        const monthLabel = date.toLocaleDateString("pt-BR", { month: "short" })

                        return {
                            month: monthLabel,
                            gross,
                            net
                        }
                    })
                    .reverse() // Oldest to newest

                setRevenueHistory(historyData)

                // 2. Fetch Forecast (Future Receivables)
                // Next 6 months
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
                const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 7, 0)

                const futureTxs = await listFinancialTransactions({
                    dateRange: {
                        start: nextMonth.toISOString().slice(0, 10),
                        end: sixMonthsLater.toISOString().slice(0, 10)
                    },
                    type: 'sale',
                    limit: 1000
                })

                // Aggregate by month
                const forecastMap = {}
                futureTxs.forEach(tx => {
                    if (!tx.date) return
                    const mId = tx.date.slice(0, 7)
                    forecastMap[mId] = (forecastMap[mId] || 0) + Number(tx.amount || 0)
                })

                const forecastList = Object.keys(forecastMap).sort().map(mId => {
                    const [y, mm] = mId.split('-')
                    const date = new Date(Number(y), Number(mm) - 1, 1)
                    return {
                        month: date.toLocaleDateString("pt-BR", { month: "long", year: 'numeric' }),
                        amount: forecastMap[mId]
                    }
                })

                setForecast(forecastList)

            })
        } catch (e) {
            console.error("Failed to load financial dashboard", e)
        }
    }, [withLoading])

    useEffect(() => {
        refreshData()
    }, [refreshData])

    const reports = useMemo(() => {
        const m = monthly || {}
        const mp = monthlyPrev || {}

        // Data for cards
        // Use grossRevenue (from transactions) if available, otherwise salesMonth (contracts)
        const sales = m.grossRevenue || 0
        const prevSales = mp.grossRevenue || 0

        const net = m.totalRevenue || 0
        const prevNet = mp.totalRevenue || 0

        const taxes = m.totalFees || 0
        const prevTaxes = mp.totalFees || 0

        const result = (m.totalRevenue || 0) - (m.expenses || 0)
        const prevResult = (mp.totalRevenue || 0) - (mp.expenses || 0)

        return [
            {
                title: "Receita Bruta",
                iconClass: "arrow-up-bold-circle-outline",
                total: formatCurrency(sales),
                average: formatDelta(sales, prevSales),
                badgecolor: "success"
            },
            {
                title: "Receita Líquida",
                iconClass: "scale-balance",
                total: formatCurrency(net),
                average: formatDelta(net, prevNet),
                badgecolor: "primary"
            },
            {
                title: "Taxas",
                iconClass: "percent",
                total: formatCurrency(taxes),
                average: formatDelta(taxes, prevTaxes),
                badgecolor: "warning"
            },
            {
                title: "Resultado",
                iconClass: "bank",
                total: formatCurrency(result),
                average: formatDelta(result, prevResult),
                badgecolor: result >= 0 ? "success" : "danger"
            },
        ]
    }, [monthly, monthlyPrev])

    return {
        isLoading,
        reports,
        revenueHistory,
        forecast
    }
}
