export const isPresent = (status) => {
    const n = Number(status)
    if (!Number.isNaN(n)) return n === 0
    return String(status || "").toLowerCase() === "present"
}

export const RISK_CHART_CONFIG = {
    series: [
        {
            name: "Risco",
            data: [42, 48, 53, 60, 68, 65, 62],
        },
    ],
    options: {
        chart: { type: "area", sparkline: { enabled: true } },
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] },
        },
        dataLabels: { enabled: false },
        colors: ["#f46a6a"],
        xaxis: { categories: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"] },
        yaxis: { max: 100, labels: { formatter: val => `${val}%` } },
        tooltip: {
            y: {
                formatter: val => `${val}%`,
            },
        },
    },
}
