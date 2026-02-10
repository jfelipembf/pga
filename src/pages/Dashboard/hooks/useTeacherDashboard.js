import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../hooks/useTenant'
import { TeacherDashboardService } from '../../../services/Dashboard/TeacherDashboardService'
import { useAuth } from '../../../hooks/useAuth'

export const useTeacherDashboard = () => {
    const { idTenant, idBranch } = useTenant()
    const { user } = useAuth()
    const userId = user?.uid

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)

    const loadData = useCallback(async () => {
        if (!idTenant || !idBranch || !userId) return

        try {
            setLoading(true)
            const res = await TeacherDashboardService.getTeacherData(idTenant, idBranch, userId)
            setData(res)
        } catch (error) {
            console.error("Erro ao carregar dashboard do professor:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, userId])

    useEffect(() => {
        loadData()
    }, [loadData])

    return {
        loading,
        data,
        refresh: loadData
    }
}
