import React, { useState, useEffect, useMemo } from "react"
import { useLoading } from "../../../hooks/useLoading"
import { getStaffDailyStats, getStaffMonthlyStats, getStaffMonthlyExperimentals, getBirthdaySummary, getExpirationSummary } from "../../../services/Summary/operational.service"
import { getStaffTasks, completeTask } from "../../../services/Tasks/tasks.service"
import { getAuthUser } from "../../../helpers/permission_helper"
import { formatCurrency } from "../Utils/dashboardUtils"

export const useOperationalDashboardLogic = () => {
    const { isLoading, withLoading } = useLoading()
    const [stats, setStats] = useState({
        todaySalesCount: 0,
        todaySalesAmount: 0,
        monthSalesAmount: 0,
        monthSalesCount: 0 // [NEW]
    })
    const [experimentals, setExperimentals] = useState([])
    const [tasks, setTasks] = useState([])
    const [birthdays, setBirthdays] = useState([]) // [NEW] Birthday State
    const [expirations, setExpirations] = useState([]) // [NEW] Expiration State

    const load = React.useCallback(async () => {
        const user = getAuthUser()
        if (!user?.uid) return

        try {
            await withLoading('page', async () => {
                const [dailyRes, monthlyRes, expListRes, tasksRes, bdayRes, expSummaryRes] = await Promise.allSettled([
                    getStaffDailyStats(user.uid),
                    getStaffMonthlyStats(user.uid),
                    getStaffMonthlyExperimentals(user.uid), // Changed to Monthly
                    getStaffTasks(user.uid),
                    getBirthdaySummary(), // [NEW] Fetch Birthdays
                    getExpirationSummary() // [NEW] Fetch Expirations
                ])

                const daily = dailyRes.status === 'fulfilled' ? dailyRes.value : { totalCount: 0, totalAmount: 0 }
                const monthly = monthlyRes.status === 'fulfilled' ? monthlyRes.value : { totalCount: 0, totalAmount: 0 }
                const expList = expListRes.status === 'fulfilled' ? expListRes.value : []
                const taskList = tasksRes.status === 'fulfilled' ? tasksRes.value : []
                const bdayList = bdayRes.status === 'fulfilled' ? bdayRes.value : []
                const expSummaryList = expSummaryRes.status === 'fulfilled' ? expSummaryRes.value : []

                setStats({
                    todaySalesCount: daily.totalCount,
                    todaySalesAmount: daily.totalAmount,
                    monthSalesAmount: monthly.totalAmount,
                    monthSalesCount: monthly.totalCount
                })
                setExperimentals(expList)
                setTasks(taskList)
                setBirthdays(bdayList)
                setExpirations(expSummaryList)
            })
        } catch (e) {
            console.error("Failed to load operational stats", e)
        }
    }, [withLoading])

    useEffect(() => {
        load()
    }, [load])

    const refreshTasks = () => load()

    const markTaskAsCompleted = async (taskId) => {
        // Optimistic Update
        const previousTasks = [...tasks];
        setTasks(currentTasks =>
            currentTasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t)
        );

        try {
            await completeTask(taskId);
        } catch (e) {
            console.error("Failed to complete task", e);
            // Revert on failure
            setTasks(previousTasks);
            throw e; // Let component handle error toast
        }
    }

    const reports = useMemo(() => {
        return [
            {
                title: "Número de Vendas",
                iconClass: "cart-outline",
                total: stats.monthSalesCount, // Changed to Monthly
                badgecolor: "success",
                average: "", // Podemos calcular média depois se necessário
                label: "No Mês" // Changed Label
            },
            {
                title: "Valor em Vendas",
                iconClass: "currency-usd",
                total: formatCurrency(stats.monthSalesAmount),
                badgecolor: "info",
                average: "", // Removed redundant average since main value is now monthly
                label: "No Mês"
            },
            {
                title: "Aulas Experimentais",
                iconClass: "star-circle-outline",
                total: experimentals.length,
                badgecolor: "warning",
                average: "",
                label: "No Mês" // Changed Label
            },
            {
                title: "Vencimentos",
                iconClass: "clock-alert-outline",
                total: expirations.length,
                badgecolor: "danger",
                average: "",
                label: "Hoje"
            },
        ]
    }, [stats, experimentals, expirations])

    return {
        isLoading: isLoading('page'),
        reports,
        experimentals,
        tasks,
        birthdays, // [NEW] Return birthdays
        expirations, // [NEW] Return expirations
        refreshTasks,
        markTaskAsCompleted
    }
}
