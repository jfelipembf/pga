import { useState, useEffect, useCallback, useMemo } from "react"
import { ContractService } from "../../../../services/Financial/ContractService"
import { tenantRepository } from "../../../../data/repositories/TenantRepository"
import { toast } from "react-toastify"
import { useTenant } from "../../../../hooks/useTenant"

/**
 * Hook para gerenciar a lógica de listagem e manutenção de Contratos (Planos)
 */
export const useContractList = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [branches, setBranches] = useState([])

    const refreshContracts = useCallback(async () => {
        if (!isReady) return

        try {
            setLoading(true)
            const data = await ContractService.listAllContracts(idTenant, idBranch)
            setContracts(data)
        } catch (error) {
            console.error("Erro ao carregar contratos:", error)
            toast.error("Erro ao carregar lista de contratos.")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady])

    const loadBranches = useCallback(async () => {
        if (!isReady) return
        try {
            const data = await tenantRepository.findBranches(idTenant)
            setBranches(data)
        } catch (error) {
            console.error("Erro ao carregar unidades:", error)
        }
    }, [idTenant, isReady])

    useEffect(() => {
        refreshContracts()
        loadBranches()
    }, [refreshContracts, loadBranches])

    const handleSave = async (data) => {
        try {
            const userId = 'current-user' // TODO: Get from auth context

            if (selectedId) {
                await ContractService.updateContract(idTenant, idBranch, userId, selectedId, data);
                toast.success("Plano atualizado com sucesso");
            } else {
                await ContractService.createContract(idTenant, idBranch, userId, data);
                toast.success("Novo plano criado com sucesso");
            }
            setIsAddingNew(false);
            setSelectedId(null);
            await refreshContracts();
        } catch (error) {
            console.error("Erro ao salvar contrato:", error);

            // If it's a Yup validation error, show detailed messages
            if (error.name === 'ValidationError' && error.inner) {
                const messages = error.inner.map(e => `${e.path}: ${e.message}`).join(', ');
                toast.error(`Erro de validação: ${messages}`);
            } else {
                toast.error(error.message || "Erro ao salvar plano");
            }
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este plano?")) return

        try {
            const userId = 'current-user' // TODO: Get from auth context
            await ContractService.deleteContract(idTenant, idBranch, userId, id)
            toast.success("Plano excluído com sucesso")
            if (selectedId === id) setSelectedId(null)
            await refreshContracts()
        } catch (error) {
            console.error("Erro ao excluir contrato:", error)
            toast.error("Erro ao excluir o plano")
        }
    }

    const selectedContract = useMemo(() => {
        return contracts.find(c => c.id === selectedId) || null
    }, [contracts, selectedId])

    return {
        contracts,
        loading,
        selectedId,
        isAddingNew,
        selectedContract,
        setSelectedId,
        setIsAddingNew,
        refreshContracts,
        handleSave,
        handleDelete,
        branches
    }
}
