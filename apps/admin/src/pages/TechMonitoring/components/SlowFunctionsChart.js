import React, { useMemo } from "react"
import ReactApexChart from "react-apexcharts"

const SlowFunctionsChart = ({ logs }) => {



    const series = useMemo(() => {
        // Handle empty/invalid logs gracefully inside the hook
        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return [{ name: 'Tempo Médio (ms)', data: [] }];
        }

        // Group by function name and calc avg duration
        const grouped = logs.reduce((acc, log) => {
            if (!log.functionName) return acc;

            if (!acc[log.functionName]) {
                acc[log.functionName] = { total: 0, count: 0 }
            }
            acc[log.functionName].total += (log.duration || 0)
            acc[log.functionName].count += 1
            return acc
        }, {})

        const data = Object.entries(grouped)
            .map(([name, val]) => ({
                x: name,
                y: Math.round(val.total / val.count)
            }))
            .sort((a, b) => b.y - a.y) // Sort by slowest
            .slice(0, 5) // Top 5

        return [{
            name: 'Tempo Médio (ms)',
            data: data
        }]
    }, [logs])

    const options = {
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: {
            bar: {
                horizontal: true,
                columnWidth: '45%',
                colors: {
                    ranges: [{ from: 0, to: 1000, color: '#34c38f' }, { from: 1001, to: 3000, color: '#f1b44c' }, { from: 3001, to: 100000, color: '#f46a6a' }]
                }
            },
        },
        dataLabels: { enabled: true, offsetX: 10 },
        // Safely extract categories
        xaxis: { categories: series[0]?.data.map(d => d.x) || [] },
        grid: { borderColor: '#f1f1f1' }
    }

    // Render fallback if no data AFTER hooks
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return <div className="text-center text-muted p-4">Aguardando dados de monitoramento...</div>
    }

    return (
        <ReactApexChart options={options} series={series} type="bar" height={350} />
    )
}

export default SlowFunctionsChart
