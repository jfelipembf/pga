import { useState, useEffect, useCallback, useMemo } from 'react'
import { AcquirerService } from '../../../../services/Financial/AcquirerService'
import { toast } from 'react-toastify'
import { useTenant } from '../../../../hooks/useTenant'
import { ALL_MOCKS } from '../constants/AcquirerMocks'

/**
 * Hook para gerenciar a lógica de Adquirentes (Máquinas de Cartão)
 */
export const useAcquirers = () => {
    const { idTenant, idBranch, isReady } = useTenant()

    const [acquirers, setAcquirers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)

    const loadAcquirers = useCallback(async () => {
        if (!isReady) return;

        try {
            setLoading(true)
            const data = await AcquirerService.listAll(idTenant, idBranch)
            setAcquirers(data) // Mostra o que tem no banco imediatamente

            // Lógica de Mocks Automáticos: Garante que os principais players existam
            let newCreated = false;

            for (const mock of ALL_MOCKS) {
                const exists = data.some(acq => acq.name && acq.name.toUpperCase().includes(mock.name.toUpperCase()));

                if (!exists) {
                    try {
                        console.log(`Adquirente ${mock.name} não encontrada. Criando Mock Automático...`);
                        await AcquirerService.createAcquirer(idTenant, idBranch, "system", mock);
                        newCreated = true;
                    } catch (mockError) {
                        console.error(`Erro ao criar mock ${mock.name}:`, mockError);
                    }
                }
            }

            if (newCreated) {
                const newData = await AcquirerService.listAll(idTenant, idBranch);
                setAcquirers(newData);
                toast.success("Adquirentes padrão (Mocks) criadas automaticamente!");
            }

        } catch (error) {
            console.error("Erro ao carregar adquirentes:", error)
            toast.error("Erro ao carregar adquirentes")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady])

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
            // Obter ID do usuário logado para auditoria
            const authUser = JSON.parse(localStorage.getItem("authUser"));
            const userId = authUser?.uid || authUser?.email || "unknown_user";

            let savedId = selectedId;

            if (selectedId) {
                await AcquirerService.update(idTenant, idBranch, userId, selectedId, data)
                toast.success("Adquirente atualizada com sucesso")
            } else {
                const newAcquirer = await AcquirerService.createAcquirer(idTenant, idBranch, userId, data)
                savedId = newAcquirer.id
                toast.success("Adquirente cadastrada com sucesso")
            }

            await loadAcquirers()

            // Mantém selecionado em vez de limpar
            setIsAddingNew(false)
            setSelectedId(savedId)

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
        loading: loading || !isReady,
        selectedId,
        isAddingNew,
        selectedAcquirer,
        handleAddClick,
        handleItemClick,
        handleSave,
        refresh: loadAcquirers
    }
}
