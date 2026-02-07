import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { AreaService } from '../../../../services/Admin/AreaService'
import { toast } from 'react-toastify'
import { useCurrentUser } from '../../../../hooks/useCurrentUser'

/**
 * Hook para gerenciar a lógica de Áreas (Areas)
 */
export const useAreas = () => {
    const { idTenant, idBranch } = useTenant()

    const user = useCurrentUser()

    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [modal, setModal] = useState(false)
    const [selectedArea, setSelectedArea] = useState(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [fetchLimit, setFetchLimit] = useState(50)

    // Cache: armazena timestamp da última carga
    const [lastLoadTime, setLastLoadTime] = useState(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    const loadAreas = useCallback(async (forceReload = false) => {
        // Cache: verifica se precisa recarregar
        const now = Date.now()
        if (!forceReload && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
            return
        }

        try {
            setLoading(true)
            const data = await AreaService.listAreas(idTenant, idBranch, fetchLimit)
            setAreas(data)
            setLastLoadTime(now)
        } catch (error) {
            console.error("Erro ao carregar áreas:", error)
            toast.error("Erro ao carregar áreas")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, fetchLimit, lastLoadTime, CACHE_DURATION])

    useEffect(() => {
        loadAreas()
    }, [loadAreas])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedArea(null)
    }

    const handleEdit = (item) => {
        setSelectedArea(item)
        setModal(true)
    }

    const handleSave = async (data) => {
        try {
            setSaving(true)
            await AreaService.saveArea(idTenant, idBranch, user.uid, {
                ...data,
                userName: user.displayName || user.email
            })
            toast.success(data.id ? "Área atualizada com sucesso" : "Área criada com sucesso")
            toggleModal()
            await loadAreas(true) // Force reload
            return true
        } catch (error) {
            console.error("Erro ao salvar área:", error)
            toast.error("Erro ao salvar área: " + error.message)
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (area) => {
        try {
            setDeleting(true)
            await AreaService.deleteArea(
                idTenant,
                idBranch,
                user.uid,
                area,
                user.displayName || user.email
            )
            toast.success("Área excluída com sucesso")
            await loadAreas(true) // Force reload
            return true
        } catch (error) {
            console.error("Erro ao excluir área:", error)
            toast.error(error.message || "Erro ao excluir área")
            return false
        } finally {
            setDeleting(false)
        }
    }

    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50)
    }, [])

    const filteredAreas = useMemo(() => {
        const filtered = areas.filter(item => {
            if (!searchTerm) return true

            const name = item.name || ''
            const description = item.description || ''

            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase())
        })

        return filtered.slice(0, fetchLimit)
    }, [areas, searchTerm, fetchLimit])

    const hasMore = useMemo(() => {
        const totalFiltered = areas.filter(item => {
            if (!searchTerm) return true
            const name = item.name || ''
            const description = item.description || ''
            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase())
        }).length
        return totalFiltered > fetchLimit
    }, [areas, searchTerm, fetchLimit])

    return {
        idTenant,
        idBranch,
        loading,
        saving,
        deleting,
        modal,
        selectedArea,
        searchTerm,
        setSearchTerm,
        filteredAreas,
        areas,
        toggleModal,
        handleEdit,
        handleSave,
        handleDelete,
        handleLoadMore,
        hasMore,
        fetchLimit,
        refresh: loadAreas
    }
}
