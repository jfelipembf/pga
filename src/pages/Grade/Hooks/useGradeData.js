import { useState, useEffect, useCallback } from "react"
import moment from "moment"
import { useTenant } from "../../../hooks/useTenant"
import { useWeekCache } from "../../../hooks/useWeekCache"
import { ClassService } from "../../../services/Classes/ClassService"
import { SessionService } from "../../../services/Classes/SessionService"
import { SessionMapper } from "../../../services/Classes/SessionMapper"
import { ActivityService } from "../../../services/Admin/ActivityService"
import { AreaService } from "../../../services/Admin/AreaService"
import { StaffService } from "../../../services/Admin/StaffService"
import { getStartOfWeek, addDays } from "../../../utils/date"
import { toast } from "react-toastify"

export const useGradeData = (referenceDate) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { get: getFromCache, set: saveToCache, cleanup, cacheStats } = useWeekCache()

    const [sessions, setSessions] = useState([])
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async (forceRefresh = false) => {
        if (!isReady) return

        try {
            setLoading(true)

            // Verificar cache primeiro (se não for refresh forçado)
            if (!forceRefresh) {
                const cached = getFromCache(referenceDate)
                if (cached) {


                    // Delay mínimo para feedback visual (300ms)
                    await new Promise(resolve => setTimeout(resolve, 300))

                    setSessions(cached.data.sessions || [])
                    setActivities(cached.data.activities || [])
                    setAreas(cached.data.areas || [])
                    setStaff(cached.data.staff || [])
                    setLoading(false)
                    return
                }
            }



            // Get date range for the current week based on referenceDate
            const startDate = getStartOfWeek(referenceDate)
            const endDate = addDays(startDate, 6)

            const [
                sessionsData,
                activitiesData,
                areasData,
                staffData,
                classesData
            ] = await Promise.all([
                SessionService.listByDateRange(idTenant, idBranch, moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')),
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch),
                StaffService.listAll(idTenant, idBranch),
                ClassService.listClasses(idTenant, idBranch)
            ])

            const activeClassIds = new Set((classesData || []).map(c => c.id))

            // Usar o Mapper centralizado para normalizar e filtrar os dados
            const normalizedSessions = SessionMapper.toUIList(sessionsData, activeClassIds)

            const loadedData = {
                sessions: normalizedSessions,
                activities: activitiesData || [],
                areas: areasData || [],
                staff: staffData || []
            }

            // Salvar no cache
            saveToCache(referenceDate, loadedData)

            setSessions(normalizedSessions)
            setActivities(activitiesData || [])
            setAreas(areasData || [])
            setStaff(staffData || [])


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

    return {
        sessions,
        setSessions,
        activities,
        areas,
        staff,
        loading,
        refresh: () => loadData(true), // Force refresh
        cacheStats: cacheStats
    }
}
