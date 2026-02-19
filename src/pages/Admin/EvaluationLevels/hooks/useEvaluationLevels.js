import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { EvaluationLevelService } from '../../../../services/Admin/EvaluationLevelService'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../hooks/useAuth'
import { useStaticData } from '../../../../contexts/StaticDataContext'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useEvaluationLevels = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { refresh } = useStaticData()
    const { user } = useAuth()

    const [levels, setLevels] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [lastLoadTime, setLastLoadTime] = useState(null)

    const loadLevels = useCallback(async (force = false) => {
        if (!isReady) return

        const now = Date.now()
        if (!force && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
            return
        }

        setLoading(true)
        try {
            const data = await EvaluationLevelService.listAll(idTenant, idBranch)
            setLevels(data)
            setLastLoadTime(now)
        } catch (error) {
            console.error("Erro ao carregar níveis de avaliação:", error)
            toast.error("Erro ao carregar níveis de avaliação")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, lastLoadTime])

    useEffect(() => {
        if (isReady) {
            loadLevels()
        }
    }, [isReady, loadLevels])

    const handleSave = async (data) => {
        try {
            setSaving(true)
            const isUpdate = !!data.id

            const payload = {
                ...data,
                userName: user?.displayName || user?.email || 'Sistema'
            }

            if (isUpdate) {
                await EvaluationLevelService.updateLevel(
                    idTenant,
                    idBranch,
                    user.uid,
                    data.id,
                    payload
                )
                toast.success("Nível de avaliação atualizado com sucesso")
            } else {
                await EvaluationLevelService.createLevel(
                    idTenant,
                    idBranch,
                    user.uid,
                    payload
                )
                toast.success("Nível de avaliação criado com sucesso")
            }

            await loadLevels(true)
            refresh?.()
            return true
        } catch (error) {
            console.error("Erro ao salvar nível de avaliação:", error)
            toast.error("Erro ao salvar nível de avaliação: " + error.message)
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (levelOrId) => {
        const id = typeof levelOrId === 'object' ? levelOrId.id : levelOrId

        try {
            setDeleting(true)
            await EvaluationLevelService.deleteLevel(
                idTenant,
                idBranch,
                user.uid,
                id,
                user?.displayName || user?.email || 'Sistema'
            )
            toast.success("Nível de avaliação excluído com sucesso")
            await loadLevels(true)
            refresh?.()
            return true
        } catch (error) {
            console.error("Erro ao excluir nível de avaliação:", error)
            toast.error(error.message || "Erro ao excluir nível de avaliação")
            return false
        } finally {
            setDeleting(false)
        }
    }

    const handleReorder = async (orderedIds) => {
        try {
            await EvaluationLevelService.reorderLevels(
                idTenant,
                idBranch,
                user.uid,
                orderedIds,
                user?.displayName || user?.email || 'Sistema'
            )
            toast.success("Ordem atualizada com sucesso")
            await loadLevels(true)
            return true
        } catch (error) {
            console.error("Erro ao reordenar níveis:", error)
            toast.error("Erro ao reordenar níveis")
            return false
        }
    }

    return {
        levels,
        loading: loading || !isReady,
        saving,
        deleting,
        handleSave,
        handleDelete,
        handleReorder,
        loadLevels
    }
}
