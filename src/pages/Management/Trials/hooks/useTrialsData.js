import { useState, useEffect, useCallback, useMemo } from "react"
import { useTenant } from "../../../../hooks/useTenant"
import { TrialService } from "../../../../services/Management/TrialService"
import { useStaticData } from "../../../../contexts/StaticDataContext"
import moment from "moment"

/**
 * Hook para gerenciar os dados da página de Aulas Experimentais.
 * Segue o padrão de enriquecimento dinâmico via Contexto.
 */
export const useTrialsData = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { activities, staff, isLoaded: staticLoaded } = useStaticData()

    const [loading, setLoading] = useState(false)
    const [rawTrials, setRawTrials] = useState([])
    const [kpis, setKpis] = useState({
        totalScheduled: 0,
        totalAttended: 0,
        totalConverted: 0,
        attendanceRate: 0,
        conversionRate: 0
    })

    // Filtros locais (para inputs)
    const [filters, setFilters] = useState({
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(30, 'days').format('YYYY-MM-DD'),
        idStaff: '',
        idActivity: '',
        search: ''
    })

    // Filtros aplicados (para busca)
    const [appliedFilters, setAppliedFilters] = useState(filters)

    const loadData = useCallback(async () => {
        if (!isReady) return

        setLoading(true)
        try {
            const data = await TrialService.listTrials(idTenant, idBranch, appliedFilters)
            setRawTrials(data)

            const stats = TrialService.calculateKPIs(data)
            setKpis(stats)
        } catch (error) {
            console.error("[useTrialsData] Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, appliedFilters])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Enriquecimento Dinâmico
    const enrichedTrials = useMemo(() => {
        if (!Array.isArray(rawTrials)) return []

        const activityMap = new Map((activities || []).map(a => [String(a.id), a]))
        const staffMap = new Map((staff || []).map(s => [String(s.id), s]))

        return rawTrials.map(trial => {
            const activity = activityMap.get(String(trial.idActivity)) || {}
            const instructor = staffMap.get(String(trial.idStaff)) || {}

            return {
                ...trial,
                activityName: activity.name || trial.activityName || 'Atividade',
                activityColor: activity.color || '#4CAF50',
                instructorName: instructor.name || trial.employeeName || 'Não definido'
            }
        })
    }, [rawTrials, activities, staff])

    const updateFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }

    const handleApplyFilters = () => {
        setAppliedFilters(filters)
    }

    return {
        loading: loading || !staticLoaded,
        trials: enrichedTrials,
        kpis,
        filters,
        updateFilter,
        applyFilters: handleApplyFilters,
        refresh: loadData,
        activities, // Exposto para o filtro na UI
        staff       // Exposto para o filtro na UI
    }
}
