import { useState, useEffect, useMemo, useCallback } from "react"
import { useLoading } from "../../../../hooks/useLoading"
import { getAuthBranchContext, getMonthlySummary } from "../../../../services/Summary/index"
import { listReceivables, listFinancialTransactions } from "../../../../services/Financial/index"
import { formatCurrency, formatDelta } from "../../../Dashboard/Utils/dashboardUtils"
import { toISODate, toMonthKey, formatDateDisplay } from "../../../../utils/date"

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
                const monthId = toMonthKey(toISODate(today))

                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const prevMonthId = toMonthKey(toISODate(prevMonth))

                // 1. Fetch Monthly Summaries (Current + Prev + History)
                const monthPromises = []
                for (let i = 0; i < 12; i++) {
                    const dt = new Date(today.getFullYear(), today.getMonth() - i, 1)
                    const id = toMonthKey(toISODate(dt))
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
                        const monthLabel = formatDateDisplay(date, { month: "short" })

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
                // Next 6 months (including current month remaining)
                const startDate = new Date(today)
                const endDate = new Date(today.getFullYear(), today.getMonth() + 7, 0)

                const futureReceivables = await listReceivables({
                    startDate: startDate,
                    endDate: endDate,
                    status: 'open'
                })

                const futureTransactions = await listFinancialTransactions({
                    dateRange: {
                        start: toISODate(startDate),
                        end: toISODate(endDate)
                    },
                    type: 'sale',
                    limit: 2000
                })

                // Aggregate by month using dueDate/date
                const forecastMap = {}

                const processItem = (dateStr, val) => {
                    if (!dateStr) return
                    const mId = toMonthKey(dateStr) // YYYY-MM
                    if (!mId) return
                    forecastMap[mId] = (forecastMap[mId] || 0) + Number(val || 0)
                }

                futureReceivables.forEach(rcv => {
                    const val = (rcv.pending !== undefined && rcv.pending !== null) ? rcv.pending : rcv.amount
                    processItem(rcv.dueDate, val)
                })

                futureTransactions.forEach(tx => {
                    // Ignore cancelled transactions
                    if (tx.status === 'cancelled' || tx.status === 'canceled') return
                    processItem(tx.date, tx.amount)
                })

                const forecastList = Object.keys(forecastMap).sort().map(mId => {
                    const [y, mm] = mId.split('-')
                    const date = new Date(Number(y), Number(mm) - 1, 1)
                    return {
                        month: formatDateDisplay(date, { month: "long", year: 'numeric' }),
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
