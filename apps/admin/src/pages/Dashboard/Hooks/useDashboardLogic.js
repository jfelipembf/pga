import { useState, useMemo } from "react"

export const useDashboardLogic = () => {
    // 1. Loading State Management
    const [loadingStates] = useState({
        page: false,
        widgets: false,
        funnel: false,
        earnings: false
    });

    const isLoading = (key) => loadingStates[key];

    // 2. Mini Widgets Data (Stats)
    const reports = useMemo(() => [
        { title: "Novos Alunos", iconClass: "account-plus", total: "15", badgecolor: "success", average: "+12%" },
        { title: "Aulas Experimentais", iconClass: "calendar-check", total: "32", badgecolor: "info", average: "+5%" },
        { title: "Novos Leads", iconClass: "source-branch", total: "124", badgecolor: "warning", average: "+2.4%" },
        { title: "Taxa de Conversão", iconClass: "chart-line", total: "12.1%", badgecolor: "primary", average: "+1.2%" },
    ], []);

    // 3. Funnel Data
    const monthly = useMemo(() => ({
        leadsMonth: 124,
        scheduled: 62,
        attended: 45,
        conversions: 15
    }), []);

    const monthlyHistory = useMemo(() => [
        { id: "2025-10", leadsMonth: 100, conversions: 10 },
        { id: "2025-11", leadsMonth: 110, conversions: 12 },
        { id: "2025-12", leadsMonth: 95, conversions: 11 },
        { id: "2026-01", leadsMonth: 124, conversions: 15 },
    ], []);

    // 4. Monthly Earnings Data
    const monthlyCurrent = 25840.50;
    const monthlyPrevious = 21450.00;

    const monthlyData = useMemo(() => [
        { month: "Jan", current: 25840, previous: 21450 },
        { month: "Fev", current: 22840, previous: 20510 },
        { month: "Mar", current: 23690, previous: 21950 },
        { month: "Abr", current: 24980, previous: 23120 },
        { month: "Mai", current: 25830, previous: 24560 },
        { month: "Jun", current: 26740, previous: 25210 },
        { month: "Jul", current: 27560, previous: 26350 },
        { month: "Ago", current: 28910, previous: 27180 },
        { month: "Set", current: 29750, previous: 27940 },
        { month: "Out", current: 30580, previous: 28670 },
        { month: "Nov", current: 31840, previous: 29810 },
        { month: "Dez", current: 33120, previous: 31200 },
    ], []);

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
