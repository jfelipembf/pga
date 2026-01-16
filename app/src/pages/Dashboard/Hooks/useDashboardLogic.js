import { useState, useEffect, useMemo } from "react"
import { useLoading } from "../../../hooks/useLoading"
import { getAuthBranchContext, getDailySummary, getMonthlySummary } from "../../../services/Summary/index"
import { formatCurrency, formatDelta, calculateChurnPercent } from "../Utils/dashboardUtils"

export const useDashboardLogic = () => {
    const { isLoading, withLoading } = useLoading()
    const [daily, setDaily] = useState(null)
    const [monthly, setMonthly] = useState(null)
    const [dailyPrev, setDailyPrev] = useState(null)
    const [monthlyPrev, setMonthlyPrev] = useState(null)
    const [monthId, setMonthId] = useState(null)
    const [monthlyHistory, setMonthlyHistory] = useState([])

    useEffect(() => {
        const ctx = getAuthBranchContext()
        if (!ctx?.idTenant || !ctx?.idBranch) return

        const load = async () => {
            try {
                await withLoading('page', async () => {
                    const today = new Date()
                    const dateStr = today.toISOString().slice(0, 10)
                    const monthId = today.toISOString().slice(0, 7)
                    setMonthId(monthId)
                    const yesterday = new Date(today)
                    yesterday.setDate(today.getDate() - 1)
                    const prevDateStr = yesterday.toISOString().slice(0, 10)
                    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                    const prevMonthId = prevMonth.toISOString().slice(0, 7)

                    const monthPromises = []
                    for (let i = 0; i < 12; i++) {
                        const dt = new Date(today.getFullYear(), today.getMonth() - i, 1)
                        const id = dt.toISOString().slice(0, 7)
                        monthPromises.push(
                            getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId: id })
                                .then(res => ({ id, data: res || null }))
                        )
                    }

                    const [d, m, dPrev, mPrev, ...mAll] = await Promise.all([
                        getDailySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, dateStr }),
                        getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId }),
                        getDailySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, dateStr: prevDateStr }),
                        getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId: prevMonthId }),
                        ...monthPromises,
                    ])
                    const safeDaily = d || {}
                    const safeMonthly = m ? { id: m.id || monthId, ...m } : { id: monthId, salesMonth: 0, expenses: 0 }
                    const safeDailyPrev = dPrev || {}
                    const safeMonthlyPrev = mPrev ? { id: mPrev.id || prevMonthId, ...mPrev } : { id: prevMonthId, salesMonth: 0, expenses: 0 }

                    setDaily(safeDaily)
                    setMonthly(safeMonthly)
                    setDailyPrev(safeDailyPrev)
                    setMonthlyPrev(safeMonthlyPrev)
                    const historyData = mAll
                        .map(entry => entry && entry.data ? { ...entry.data, id: entry.id } : null)
                        .filter(Boolean)
                        .reverse() // oldest to newest
                    const finalHistory = historyData.length ? historyData : [safeMonthly]
                    setMonthlyHistory(finalHistory)
                })
            } catch (e) {
                console.error("Failed to load summaries", e)
            }
        }

        load()
    }, [withLoading])

    const reports = useMemo(() => {
        const d = daily || {}
        const m = monthly || {}
        const dp = dailyPrev || {}
        const mp = monthlyPrev || {}

        // Calcular porcentagem de churn
        const currentChurnPercent = calculateChurnPercent(m.churnMonth, m.activeAvg)
        const prevChurnPercent = calculateChurnPercent(mp.churnMonth, mp.activeAvg)

        return [
            { title: "Ativos", iconClass: "account-group", total: m.activeAvg ?? "--", average: formatDelta(m.activeAvg, mp.activeAvg), badgecolor: "info" },
            { title: "Novos", iconClass: "account-plus", total: m.newCount ?? "--", average: formatDelta(m.newCount, mp.newCount), badgecolor: "success" },
            { title: "Hoje (vendas do dia)", iconClass: "cash-multiple", total: formatCurrency(d.salesDay), average: formatDelta(d.salesDay, dp.salesDay), badgecolor: "warning" },
            { title: "Vendas (mês)", iconClass: "chart-line", total: formatCurrency(m.salesMonth), average: formatDelta(m.salesMonth, mp.salesMonth), badgecolor: "danger" },
            { title: "Suspensos", iconClass: "pause-octagon", total: m.suspendedCount ?? "--", average: formatDelta(m.suspendedCount, mp.suspendedCount), badgecolor: "info" },
            { title: "Cancelamentos", iconClass: "cancel", total: m.contractsCanceledMonth ?? "--", average: formatDelta(m.contractsCanceledMonth, mp.contractsCanceledMonth), badgecolor: "danger" },
            { title: "Churn", iconClass: "rotate-3d-variant", total: currentChurnPercent != null ? `${currentChurnPercent}%` : "--", average: formatDelta(currentChurnPercent, prevChurnPercent), badgecolor: "warning" },
            { title: "Despesas", iconClass: "currency-usd", total: formatCurrency(m.expenses), average: formatDelta(m.expenses, mp.expenses), badgecolor: "secondary" },
        ]
    }, [daily, monthly, dailyPrev, monthlyPrev])

    const monthlyCurrent = monthly?.salesMonth ?? 0
    const monthlyPrevious = monthlyPrev?.salesMonth ?? 0

    const monthlyData = useMemo(() => {
        const toLabel = id => {
            if (!id) return "Mês"
            const [y, m] = id.split("-").map(Number)
            const date = new Date(y, (m || 1) - 1, 1)
            return date.toLocaleDateString("pt-BR", { month: "short" })
        }
        const list = monthlyHistory.length ? monthlyHistory : [{ id: monthId, salesMonth: monthlyCurrent }]
        return list.map((item, idx) => ({
            month: toLabel(item.id),
            current: item.salesMonth ?? 0,
            previous: list[idx - 1]?.salesMonth ?? 0,
        }))
    }, [monthlyHistory, monthId, monthlyCurrent])

    return {
        isLoading,
        reports,
        monthly,
        monthlyHistory,
        monthlyCurrent,
        monthlyPrevious,
        monthlyData
    }
}
