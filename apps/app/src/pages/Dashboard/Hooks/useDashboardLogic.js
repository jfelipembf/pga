import { useState, useEffect, useMemo, useCallback } from "react"
import { useLoading } from "../../../hooks/useLoading"
import { getAuthBranchContext, getDailySummary, getMonthlySummary } from "../../../services/Summary/index"
import { formatCurrency, formatDelta, calculateChurnPercent, calculatePercent } from "../Utils/dashboardUtils"
import { toISODate, toMonthKey, addDays, formatDateDisplay } from "../../../utils/date"

export const useDashboardLogic = () => {
    const { isLoading, withLoading } = useLoading()
    const [daily, setDaily] = useState(null)
    const [monthly, setMonthly] = useState(null)
    const [dailyPrev, setDailyPrev] = useState(null)
    const [monthlyPrev, setMonthlyPrev] = useState(null)
    const [monthId, setMonthId] = useState(null)
    const [monthlyHistory, setMonthlyHistory] = useState([])

    const refreshData = useCallback(async () => {
        const ctx = getAuthBranchContext()
        if (!ctx?.idTenant || !ctx?.idBranch) return

        try {
            await withLoading('page', async () => {
                const today = new Date()
                const monthId = toMonthKey(toISODate(today))
                setMonthId(monthId)
                const yesterday = addDays(today, -1)
                
                // Calculate previous month by subtracting ~30 days and getting first of that month
                const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const prevMonthId = toMonthKey(toISODate(prevMonthDate))

                const monthPromises = []
                for (let i = 0; i < 12; i++) {
                    // Calculate month offset (keep Date constructor for month arithmetic)
                    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
                    const id = toMonthKey(toISODate(monthDate))
                    monthPromises.push(
                        getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId: id })
                            .then(res => ({ id, data: res || null }))
                    )
                }

                const [d, m, dPrev, mPrev, ...mAll] = await Promise.all([
                    getDailySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, dateStr: toISODate(today) }),
                    getMonthlySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, monthId }),
                    getDailySummary({ idTenant: ctx.idTenant, idBranch: ctx.idBranch, dateStr: toISODate(yesterday) }),
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
    }, [withLoading])

    useEffect(() => {
        refreshData()
    }, [refreshData])

    const reports = useMemo(() => {
        const m = monthly || {}
        const mp = monthlyPrev || {}

        // Calcular porcentagem de churn
        const currentChurnPercent = calculateChurnPercent(m.churnMonth, m.activeAvg)
        const prevChurnPercent = calculateChurnPercent(mp.churnMonth, mp.activeAvg)

        // Calcular renovação
        const renewalRate = calculatePercent(m.renewalsMonth, m.expiredContractsMonth)
        const prevRenewalRate = calculatePercent(mp.renewalsMonth, mp.expiredContractsMonth)

        return [
            { title: "Vendas", iconClass: "currency-usd", total: formatCurrency(m.salesMonth || 0), average: formatDelta(m.salesMonth, mp.salesMonth), badgecolor: "success" },
            { title: "Ativos", iconClass: "account-group", total: m.activeAvg ?? "--", average: formatDelta(m.activeAvg, mp.activeAvg), badgecolor: "info" },
            { title: "Novos", iconClass: "account-plus", total: m.newCount ?? "--", average: formatDelta(m.newCount, mp.newCount), badgecolor: "success" },
            { title: "Renovação", iconClass: "refresh", total: renewalRate != null ? `${renewalRate}%` : "--", average: formatDelta(renewalRate, prevRenewalRate), badgecolor: "primary" },
            { title: "Retornos", iconClass: "account-convert", total: m.returnsMonth ?? "--", average: formatDelta(m.returnsMonth, mp.returnsMonth), badgecolor: "info" },

            { title: "Churn", iconClass: "rotate-3d-variant", total: currentChurnPercent != null ? `${currentChurnPercent}%` : "--", average: formatDelta(currentChurnPercent, prevChurnPercent), badgecolor: "warning" },
            { title: "Cancelamentos", iconClass: "cancel", total: m.contractsCanceledMonth ?? "--", average: formatDelta(m.contractsCanceledMonth, mp.contractsCanceledMonth), badgecolor: "danger" },
            { title: "Suspensos", iconClass: "pause-octagon", total: m.suspendedCount ?? "--", average: formatDelta(m.suspendedCount, mp.suspendedCount), badgecolor: "light" },
        ]
    }, [monthly, monthlyPrev])

    const monthlyCurrent = monthly?.salesMonth ?? 0
    const monthlyPrevious = monthlyPrev?.salesMonth ?? 0

    const monthlyData = useMemo(() => {
        const toLabel = id => {
            if (!id) return "Mês"
            const [y, m] = id.split("-").map(Number)
            const date = new Date(y, (m || 1) - 1, 1)
            return formatDateDisplay(date, { month: "short" })
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
        loading: isLoading,
        refreshData,
        reports,
        daily,
        monthly,
        dailyPrev,
        monthlyPrev,
        monthlyHistory,
        monthlyCurrent,
        monthlyPrevious,
        monthlyData
    }
}
