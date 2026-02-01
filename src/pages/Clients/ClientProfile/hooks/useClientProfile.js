import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTenant } from "../../../../hooks/useTenant"
import { ClientService } from "../../../../services/Clients/ClientService"
import { toast } from "react-toastify"
import { PROFILE_TABS } from "../constants/profileConstants"

/**
 * Hook para gerenciar a lógica da página de Perfil do Cliente.
 */
export const useClientProfile = () => {
    const { id } = useParams()
    const { tenantId, branchId } = useTenant()

    const navigate = useNavigate()

    const [client, setClient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(PROFILE_TABS.SUMMARY)
    const [isDeleting, setIsDeleting] = useState(false)

    // Helper para obter usuário logado
    const getAuthUser = () => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }

    // Carregar dados do cliente
    const loadClient = useCallback(async () => {
        if (!tenantId || !branchId || !id) return

        try {
            setLoading(true)
            const data = await ClientService.getClientById(tenantId, branchId, id)
            if (!data) {
                toast.error("Cliente não encontrado.")
                navigate(-1) // Go back safe
                return
            }
            setClient(data)
        } catch (error) {
            console.error("Erro ao carregar perfil do cliente:", error)
            toast.error("Erro ao carregar dados do cliente.")
        } finally {
            setLoading(false)
        }
    }, [tenantId, branchId, id, navigate])

    // Deletar cliente
    const deleteClient = async () => {
        if (!tenantId || !branchId) return

        try {
            setIsDeleting(true)
            const user = getAuthUser()
            await ClientService.deleteClient(tenantId, branchId, user?.uid, id)
            toast.success("Cliente excluído com sucesso.")
            navigate(-1)
        } catch (error) {
            console.error("Erro ao excluir cliente:", error)
            toast.error("Erro ao excluir cliente.")
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        if (tenantId && branchId && id) {
            loadClient()
        }
    }, [tenantId, branchId, id, loadClient])

    return {
        client,
        loading,
        activeTab,
        setActiveTab,
        refreshData: loadClient,
        handleDelete: deleteClient,
        isDeleting,
        idTenant: tenantId,
        idBranch: branchId
    }
}
