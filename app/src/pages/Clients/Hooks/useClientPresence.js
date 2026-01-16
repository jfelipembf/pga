import { useState, useMemo } from "react"
import { calculatePresenceStats } from "../../../helpers/presence"
import { isPresent } from "../Utils/presenceUtils"

export const useClientPresence = (presences = []) => {
    const [range, setRange] = useState([null, null])
    const [startDate, endDate] = range

    // Calcular estatísticas mensais
    const monthlyStats = useMemo(() => {
        return calculatePresenceStats(presences)
    }, [presences])

    const filtered = useMemo(() => {
        if (!startDate || !endDate) return presences
        const start = startDate.getTime()
        const end = endDate.getTime()
        return presences.filter(p => {
            const ts = new Date(p.activityDate || p.sessionDate || p.date).getTime()
            return !Number.isNaN(ts) && ts >= start && ts <= end
        })
    }, [presences, startDate, endDate])

    const summary = useMemo(() => {
        const total = filtered.length
        const pres = filtered.filter(p => isPresent(p.status)).length
        const abs = filtered.filter(p => !isPresent(p.status)).length
        return { total, pres, abs }
    }, [filtered])

    return {
        range,
        setRange,
        startDate,
        endDate,
        monthlyStats,
        filtered,
        summary
    }
}
