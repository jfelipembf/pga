import { useState, useEffect, useCallback, useMemo } from "react"
import { useTenant } from "../../../../hooks/useTenant"
import { TrialService } from "../../../../services/Management/TrialService"
import moment from "moment"

/**
 * Hook para gerenciar os dados da página de Aulas Experimentais
 */
export const useTrialsData = () => {
    const { idTenant, idBranch, isReady } = useTenant()

    const [loading, setLoading] = useState(false)
    const [trials, setTrials] = useState([])
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
            setTrials(data)

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

    const updateFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }

    const handleApplyFilters = () => {
        setAppliedFilters(filters)
    }

    return {
        loading,
        trials,
        kpis,
        filters,
        updateFilter,
        applyFilters: handleApplyFilters,
        refresh: loadData
    }
}
