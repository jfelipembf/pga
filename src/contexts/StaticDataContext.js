import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ActivityService } from '../services/Admin/ActivityService'
import { AreaService } from '../services/Admin/AreaService'
import { StaffService } from '../services/Admin/StaffService'
import { EvaluationLevelService } from '../services/Admin/EvaluationLevelService'
import { useTenant } from '../hooks/useTenant'

const StaticDataContext = createContext()

export const StaticDataProvider = ({ children }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [evaluationLevels, setEvaluationLevels] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(null)
    const [lastBranch, setLastBranch] = useState(null)

    const loadStaticData = useCallback(async (force = false) => {
        if (!isReady) return

        // Se mudou de branch ou ainda não carregou, carregar
        if (!force && isLoaded && lastBranch === idBranch) return

        setIsLoading(true)
        setError(null)

        try {
            const [activitiesData, areasData, staffData, levelsData] = await Promise.all([
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch),
                StaffService.listAll(idTenant, idBranch),
                EvaluationLevelService.listAll(idTenant, idBranch)
            ])

            setActivities(activitiesData || [])
            setAreas(areasData || [])
            setStaff(staffData || [])
            setEvaluationLevels(levelsData || [])
            setIsLoaded(true)
            setLastBranch(idBranch)
        } catch (err) {
            console.error('[StaticData] Erro ao carregar dados fixos:', err)
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }, [idTenant, idBranch, isReady, isLoaded, lastBranch])

    // Carregar automaticamente quando o tenant estiver pronto
    useEffect(() => {
        if (isReady && (!isLoaded || lastBranch !== idBranch)) {
            loadStaticData()
        }
    }, [isReady, idBranch, isLoaded, lastBranch, loadStaticData])

    const value = {
        activities,
        areas,
        staff,
        evaluationLevels,
        isLoading,
        isLoaded,
        error,
        refresh: () => loadStaticData(true)
    }

    return (
        <StaticDataContext.Provider value={value}>
            {children}
        </StaticDataContext.Provider>
    )
}

export const useStaticData = () => {
    const context = useContext(StaticDataContext)
    if (!context) {
        throw new Error('useStaticData deve ser usado dentro de um StaticDataProvider')
    }
    return context
}
