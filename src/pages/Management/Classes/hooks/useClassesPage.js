import { useState, useEffect, useCallback, useRef } from "react"
import { useTenant } from "../../../../hooks/useTenant"
import { useWeekCache } from "../../../../hooks/useWeekCache"
import { useLoading } from "../../../../hooks/useLoading"
import { toast } from "react-toastify"
import { ClassService } from "../../../../services/Classes/ClassService"
import { SessionService } from "../../../../services/Classes/SessionService"
import { useClassFormLogic } from "./useClassFormLogic"
import { useClassGridLogic } from "./useClassGridLogic"
import { useStaticData } from "../../../../contexts/StaticDataContext"
import moment from "moment"

/**
 * Hook para gerenciar os dados da página de Gestão de Turmas.
 * Agora consome o StaticDataContext para evitar buscas redundantes de Atividades, Áreas e Staff.
 * Mantém sua própria lógica de busca de Sessões e Turmas para permitir navegação independente da Grade Operacional.
 */
export const useClassesPage = ({ setBreadcrumbItems, referenceDate }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { isLoading, withLoading } = useLoading()
    const cache = useWeekCache()
    const isInitialLoadRef = useRef(true)

    // 1. Obtém dados estáticos do Contexto
    const {
        activities: staticActivities,
        areas: staticAreas,
        staff: staticStaff,
        isLoaded: staticLoaded
    } = useStaticData()

    const [data, setData] = useState({ classes: [], sessions: [] })
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isNavigationLoading, setIsNavigationLoading] = useState(false)

    // Load data (Sessions and Classes only)
    const loadData = useCallback(async (forceRefresh = false) => {
        if (!isReady || !staticLoaded) return

        try {
            if (!isInitialLoadRef.current) {
                setIsNavigationLoading(true)
            }

            // Verificar cache primeiro
            if (!forceRefresh) {
                const cached = cache.get(referenceDate)
                if (cached) {
                    await new Promise(resolve => setTimeout(resolve, 300))
                    setData({
                        classes: cached.data.classes || [],
                        sessions: cached.data.sessions || []
                    })
                    setIsInitialLoading(false)
                    isInitialLoadRef.current = false
                    setIsNavigationLoading(false)
                    return
                }
            }

            const startDate = moment(referenceDate).startOf('week').format('YYYY-MM-DD')
            const endDate = moment(referenceDate).endOf('week').format('YYYY-MM-DD')

            const [classesData, sessionsData] = await Promise.all([
                ClassService.listClasses(idTenant, idBranch),
                SessionService.listByDateRange(idTenant, idBranch, startDate, endDate)
            ])

            const loadedData = {
                classes: classesData || [],
                sessions: sessionsData || []
                // Nota: não salvamos staticData aqui pois já vem do StaticDataContext
            }

            // Salvar no cache (apenas o que é dinâmico por semana)
            cache.set(referenceDate, loadedData)

            setData(loadedData)

        } catch (error) {
            console.error("Error loading classes data:", error)
            toast.error("Erro ao carregar dados da grade")
        } finally {
            setIsInitialLoading(false)
            isInitialLoadRef.current = false
            setIsNavigationLoading(false)
        }
    }, [idTenant, idBranch, isReady, referenceDate, cache, staticLoaded])

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
        reloadData: () => loadData(true)
    })

    const gridLogic = useClassGridLogic({
        data: {
            classes: data.classes,
            sessions: data.sessions,
            activities: staticActivities,
            areas: staticAreas,
            instructors: staticStaff
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
        activities: staticActivities,
        areas: staticAreas,
        instructors: staticStaff,
        cacheStats: cache.cacheStats
    }
}
