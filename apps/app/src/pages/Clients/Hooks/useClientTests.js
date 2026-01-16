import { useMemo, useState } from "react"
import { normalizeTests, getChartConfig } from "../Utils/testsUtils"

export const useClientTests = (tests = []) => {
    const normalized = useMemo(() => normalizeTests(tests), [tests])

    const [selectedId, setSelectedId] = useState(normalized[0]?.id || null)

    const selected = useMemo(
        () => normalized.find(t => t.id === selectedId) || normalized[0],
        [normalized, selectedId]
    )

    const isTime = (selected?.type || "").toLowerCase() === "tempo"

    const filteredTests = useMemo(
        () => normalized.filter(t => t.type.toLowerCase() === (selected?.type || "").toLowerCase()),
        [normalized, selected]
    )

    const { chartSeries, chartOptions } = useMemo(
        () => getChartConfig(filteredTests, selected, isTime),
        [filteredTests, selected, isTime]
    )

    const sideMenuItems = useMemo(
        () =>
            normalized.map(t => ({
                id: t.id,
                title: t.date,
                subtitle: t.type,
                meta: t.label,
            })),
        [normalized]
    )

    return {
        selectedId,
        setSelectedId,
        selected,
        isTime,
        filteredTests,
        chartSeries,
        chartOptions,
        sideMenuItems
    }
}
