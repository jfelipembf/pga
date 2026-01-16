import { useMemo } from "react"
import { calculateClientPresenceCardStats } from "../../../helpers/presence"
import { isPresent } from "../Utils/presenceUtils"

export const useClientSummary = ({
    client,
    contracts = [],
    financial = [],
    presences = [],
    enrollments = [],
    attendanceMonthly = []
}) => {
    const monthlyWave = useMemo(() => {
        // Generate last 12 months dynamically to ensure consistency with new calculation logic
        const months = []
        const today = new Date()
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
            months.push(d)
        }

        const stats = months.map(d => {
            const mStats = calculateClientPresenceCardStats({ presences, enrollments: [] }, d)
            const label = mStats.current.monthLabel.split(' de ')
            // Short label logic: Jan/26
            const shortLabel = `${label[0].substring(0, 3)}/${label[1].slice(-2)}`

            return {
                id: d.toISOString().slice(0, 7), // YYYY-MM
                label: shortLabel,
                expected: mStats.current.expected,
                attended: mStats.current.attended,
                percent: mStats.current.frequency
            }
        })

        // Filter out months with no data to keep chart clean? Or keep to show zeros?
        // Let's filter out months with 0 expected to match previous behavior if desired,
        // but showing 0s is probably better context. 
        // Logic asked: show last 12 months.

        const categories = stats.map(s => s.label)
        const percent = stats.map(s => Number(s.percent.toFixed(1)))

        // For tooltip reference
        const attended = stats.map(s => s.attended)
        const expected = stats.map(s => s.expected)

        const series = [{ name: "% presença", data: percent }]

        const options = {
            chart: {
                type: "area",
                sparkline: { enabled: true },
                toolbar: { show: false },
            },
            stroke: { curve: "smooth", width: 3 },
            fill: {
                type: "gradient",
                gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
            },
            dataLabels: { enabled: false },
            colors: ["#34c38f"],
            xaxis: { categories },
            yaxis: {
                min: 0,
                max: 100,
                labels: { formatter: val => `${Math.round(val)}%` },
            },
            tooltip: {
                y: {
                    formatter: (val, opts) => {
                        const i = opts?.dataPointIndex ?? 0
                        const att = attended[i] ?? 0
                        const exp = expected[i] ?? 0
                        return `${Math.round(val)}% (${att}/${exp} aulas)`
                    },
                    title: { formatter: () => "Frequência" },
                },
            },
        }

        return { options, series, hasData: percent.some(p => p > 0) }
    }, [presences])

    const presenceSummary = useMemo(() => {
        const pres = presences.filter(p => isPresent(p.status)).length
        const abs = presences.filter(p => !isPresent(p.status)).length
        return { presences: pres, absences: abs }
    }, [presences])

    const presenceCard = useMemo(() => {
        return calculateClientPresenceCardStats({ presences, enrollments }, new Date())
    }, [enrollments, presences])

    const financialSummary = useMemo(() => {
        const total = financial.reduce((sum, f) => sum + Number(f.amount || 0), 0)
        const debt = financial
            .reduce((s, f) => s + Number(f.pending || 0), 0)
        const credit = financial.filter(f => Number(f.amount || 0) < 0).reduce((s, f) => s + Number(f.amount || 0), 0)
        return [
            { id: "total", label: "Total movimentado", value: total, color: "primary" },
            { id: "debt", label: "Saldo devedor", value: debt, color: "danger" },
            { id: "credit", label: "Créditos", value: credit, color: "success" },
        ]
    }, [financial])

    const recentTransactions = useMemo(() => financial.slice(0, 5), [financial])

    return {
        monthlyWave,
        presenceSummary,
        presenceCard,
        financialSummary,
        recentTransactions
    }
}
