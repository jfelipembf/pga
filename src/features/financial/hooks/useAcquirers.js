import { useState, useEffect, useCallback, useMemo } from 'react'
import { AcquirerService } from '../../../services/Financial/AcquirerService'
import { toast } from 'react-toastify'
import { useTenant } from '../../../hooks/useTenant'

/**
 * Hook para gerenciar a lógica de Adquirentes (Máquinas de Cartão)
 */
export const useAcquirers = () => {
    const { idTenant, idBranch } = useTenant()

    // IDs mapeados já estão corretos

    const [acquirers, setAcquirers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)

    const loadAcquirers = useCallback(async () => {
        try {
            setLoading(true)
            const data = await AcquirerService.listAll(idTenant, idBranch)
            setAcquirers(data)
        } catch (error) {
            console.error("Erro ao carregar adquirentes:", error)
            toast.error("Erro ao carregar adquirentes")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        loadAcquirers()
    }, [loadAcquirers])

    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleItemClick = (item) => {
        setSelectedId(item.id)
        setIsAddingNew(false)
    }

    const handleSave = async (data) => {
        try {
            if (selectedId) {
                await AcquirerService.update(idTenant, idBranch, selectedId, data)
                toast.success("Adquirente atualizada com sucesso")
            } else {
                await AcquirerService.createAcquirer(idTenant, idBranch, data)
                toast.success("Adquirente cadastrada com sucesso")
            }
            setIsAddingNew(false)
            setSelectedId(null)
            await loadAcquirers()
        } catch (error) {
            console.error("Erro ao salvar adquirente:", error)
            toast.error(error.message || "Erro ao salvar adquirente")
        }
    }

    const selectedAcquirer = useMemo(() => {
        return acquirers.find(a => a.id === selectedId) || null
    }, [acquirers, selectedId])

    return {
        acquirers,
        loading,
        selectedId,
        isAddingNew,
        selectedAcquirer,
        handleAddClick,
        handleItemClick,
        handleSave,
        refresh: loadAcquirers
    }
}
