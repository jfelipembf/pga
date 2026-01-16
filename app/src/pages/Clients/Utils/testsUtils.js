import { formatDate } from "../../../helpers/date"

export const normalizeTests = (tests) => {
    return tests.map(t => {
        const isTime = (t.type || "").toLowerCase() === "time" || (t.type || "").toLowerCase() === "tempo"
        const value = isTime ? Number(t.timeSeconds || t.value || 0) : Number(t.distanceMeters || t.value || 0)
        const label =
            t.label ||
            (isTime
                ? t.distanceMeters
                    ? `${t.distanceMeters}m`
                    : "Tempo"
                : `${t.distanceMeters || ""}m ${t.stroke || ""}`.trim())
        return {
            id: t.idTest || t.id,
            date: formatDate(t.date),
            type: isTime ? "Tempo" : "Distância",
            label,
            value,
            raw: t,
        }
    })
}

export const getChartConfig = (filteredTests, selected, isTime) => {
    const chartSeries = [
        {
            name: `${selected?.label || "Teste"} (${selected?.type || ""})`,
            data: filteredTests.map(t => t.value),
        },
    ]

    const chartOptions = {
        chart: { toolbar: { show: false } },
        xaxis: { categories: filteredTests.map(t => t.date) },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3 },
        colors: [isTime ? "#3c5068" : "#34c38f"],
        markers: { size: 5 },
        tooltip: {
            y: {
                formatter: val => (isTime ? `${val.toFixed(2)} s` : `${val} m`),
            },
        },
        yaxis: {
            labels: {
                formatter: val => (isTime ? `${val}s` : `${val}m`),
            },
        },
    }

    return { chartSeries, chartOptions }
}
