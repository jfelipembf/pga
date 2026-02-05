import { useState, useEffect, useCallback, useRef } from "react"
import { useTenant } from "../../../../hooks/useTenant"
import { useWeekCache } from "../../../../hooks/useWeekCache"
import { useLoading } from "../../../../hooks/useLoading"
import { toast } from "react-toastify"
import { ClassService } from "../../../../services/Classes/ClassService"
import { StaffService } from "../../../../services/Admin/StaffService"
import { ActivityService } from "../../../../services/Admin/ActivityService"
import { AreaService } from "../../../../services/Admin/AreaService"
import { useClassFormLogic } from "./useClassFormLogic"
import { useClassGridLogic } from "./useClassGridLogic"
import moment from "moment"

export const useClassesPage = ({ setBreadcrumbItems, referenceDate }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { isLoading, withLoading } = useLoading()
    const cache = useWeekCache()
    const isInitialLoadRef = useRef(true)

    const [data, setData] = useState({ classes: [], sessions: [] })
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [instructors, setInstructors] = useState([])
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isNavigationLoading, setIsNavigationLoading] = useState(false)

    // Breadcrumbs
    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Turmas", link: "/admin/classes" }
        ]
        setBreadcrumbItems("Gestão de Turmas", breadcrumbItems)
    }, [setBreadcrumbItems])

    // Load data
    const loadData = useCallback(async (forceRefresh = false) => {
        if (!isReady) return

        try {
            // Se não é carregamento inicial, mostra loading de navegação
            if (!isInitialLoadRef.current) {
                setIsNavigationLoading(true)
            }

            // Verificar cache primeiro (se não for refresh forçado)
            if (!forceRefresh) {
                const cached = cache.get(referenceDate)
                if (cached) {
                    console.log('📦 Dados carregados do cache (Admin)')

                    // Delay mínimo para feedback visual (300ms)
                    await new Promise(resolve => setTimeout(resolve, 300))

                    setData({
                        classes: cached.data.classes || [],
                        sessions: cached.data.sessions || []
                    })
                    setActivities(cached.data.activities || [])
                    setAreas(cached.data.areas || [])
                    setInstructors(cached.data.instructors || [])
                    setIsInitialLoading(false)
                    isInitialLoadRef.current = false
                    setIsNavigationLoading(false)
                    return
                }
            }

            console.log('🔄 Carregando dados da API (Admin)...')

            const startDate = moment(referenceDate).startOf('week').format('YYYY-MM-DD')
            const endDate = moment(referenceDate).endOf('week').format('YYYY-MM-DD')

            const [classesData, sessionsData, activitiesData, areasData, staffData] = await Promise.all([
                ClassService.listClasses(idTenant, idBranch),
                ClassService.listSessions(idTenant, idBranch, startDate, endDate),
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch),
                StaffService.listAll(idTenant, idBranch)
            ])

            const loadedData = {
                classes: classesData || [],
                sessions: sessionsData || [],
                activities: activitiesData || [],
                areas: areasData || [],
                instructors: staffData || []
            }

            // Salvar no cache
            cache.set(referenceDate, loadedData)

            setData({
                classes: classesData || [],
                sessions: sessionsData || []
            })
            setActivities(activitiesData || [])
            setAreas(areasData || [])
            setInstructors(staffData || [])

            console.log(`✅ ${classesData?.length || 0} turmas, ${sessionsData?.length || 0} sessões carregadas`)
        } catch (error) {
            console.error("Error loading classes data:", error)
            toast.error("Erro ao carregar dados da grade")
        } finally {
            setIsInitialLoading(false)
            isInitialLoadRef.current = false
            setIsNavigationLoading(false)
        }
    }, [idTenant, idBranch, isReady, referenceDate, cache.get, cache.set])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Cleanup do cache a cada 5 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            cache.cleanup()
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [cache])

    const formLogic = useClassFormLogic({
        toast,
        withLoading,
        reloadData: () => loadData(true) // Force refresh após salvar/deletar
    })

    const gridLogic = useClassGridLogic({
        data: {
            classes: data.classes,
            sessions: data.sessions,
            activities,
            areas,
            instructors
        },
        formState: formLogic.formState,
        setFormState: formLogic.setFormState,
        referenceDate
    })

    return {
        ...formLogic,
        ...gridLogic,
        isLoading,
        isInitialLoading,
        isNavigationLoading,
        activities,
        areas,
        instructors,
        cacheStats: cache.cacheStats
    }
}
