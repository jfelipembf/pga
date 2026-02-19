import { useState, useEffect, useCallback, useMemo } from "react"
import moment from "moment"
import { useTenant } from "../../../hooks/useTenant"
import { useWeekCache } from "../../../hooks/useWeekCache"
import { SessionService } from "../../../services/Classes/SessionService"
import { SessionMapper } from "../../../services/Classes/SessionMapper"
import { getStartOfWeek, addDays } from "../../../utils/date"
import { toast } from "react-toastify"
import { useStaticData } from "../../../contexts/StaticDataContext"

/**
 * Hook para buscar e gerenciar dados da grade.
 * Separa a busca (fetch) do enriquecimento (join com dados estáticos).
 * Isso garante que, se os dados estáticos carregarem depois, a grade se auto-atualiza.
 */
export const useGradeData = (referenceDate) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { activities, areas, staff, refresh: refreshStatic, isLoaded: staticLoaded } = useStaticData()
    const { get: getFromCache, set: saveToCache, cleanup, cacheStats } = useWeekCache()

    const [rawSessions, setRawSessions] = useState([])
    const [loading, setLoading] = useState(true)

    // 1. Busca de Dados Brutos (Raw)
    const loadData = useCallback(async (forceRefresh = false) => {
        if (!isReady) return

        try {
            setLoading(true)

            // Verificar cache primeiro (se não for refresh forçado)
            if (!forceRefresh) {
                const cached = getFromCache(referenceDate)
                if (cached && cached.data?.sessions) {
                    setRawSessions(cached.data.sessions)
                    setLoading(false)
                    return
                }
            }

            const startDate = getStartOfWeek(referenceDate)
            const endDate = addDays(startDate, 6)

            const [sessionsData] = await Promise.all([
                SessionService.listByDateRange(
                    idTenant,
                    idBranch,
                    moment(startDate).format('YYYY-MM-DD'),
                    moment(endDate).format('YYYY-MM-DD')
                )
            ])

            const normalizedSessions = SessionMapper.toUIList(sessionsData)

            // Salvamos no cache os dados normalizados, mas sem enriquecimento (o join é feito na UI)
            saveToCache(referenceDate, { sessions: normalizedSessions })
            setRawSessions(normalizedSessions)

        } catch (error) {
            console.error("Error loading grade data:", error)
            toast.error("Erro ao carregar dados da grade")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, referenceDate, getFromCache, saveToCache])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Cleanup do cache a cada 5 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            cleanup()
        }, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [cleanup])

    // 2. Enriquecimento Dinâmico (Memoizado)
    // Isso garante que se 'activities' ou 'staff' mudarem, a grade atualiza instantaneamente
    const enrichedSessions = useMemo(() => {
        if (!Array.isArray(rawSessions)) return []

        const activityMap = new Map((activities || []).map(a => [String(a.id), a]))
        const areaMap = new Map((areas || []).map(a => [String(a.id), a]))
        const staffMap = new Map((staff || []).map(s => [String(s.id), s]))

        return rawSessions.map(session => {
            const activity = activityMap.get(String(session.idActivity)) || {}
            const area = areaMap.get(String(session.idArea)) || {}
            const instructor = staffMap.get(String(session.idStaff)) || {}

            return {
                ...session,
                activityName: activity.name || 'Atividade',
                activityColor: activity.color || activity.colorHex || '#4CAF50',
                color: activity.color || activity.colorHex || '#4CAF50', // For backward compatibility
                areaName: area.name || '',
                areaColor: area.color || area.colorHex || '#2196F3',
                instructorName: instructor.name || '',
                instructorPhone: instructor.mobile || instructor.phone || instructor.cellPhone || '',
                employeeName: instructor.name || '',
                capacity: session.capacity || session.maxCapacity || 20,
                isActive: session.isActive !== false,
                weekDays: session.weekday !== undefined && session.weekday !== null ? [Number(session.weekday)] : (session.weekDays || []),
            }
        })
    }, [rawSessions, activities, areas, staff])

    return {
        sessions: enrichedSessions,
        setSessions: setRawSessions, // Para atualizações otimistas no state bruto
        activities,
        areas,
        staff,
        loading: loading || !staticLoaded, // Só para de carregar quando dados estáticos estão prontos
        refresh: () => {
            refreshStatic()
            loadData(true)
        },
        cacheStats
    }
}
