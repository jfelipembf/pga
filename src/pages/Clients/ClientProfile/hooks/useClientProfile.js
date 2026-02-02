import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTenant } from "../../../../hooks/useTenant"
import { ClientService } from "../../../../features/clients"
import { toast } from "react-toastify"
import { PROFILE_TABS } from "../constants/profileConstants"

/**
 * Hook para gerenciar a lógica da página de Perfil do Cliente.
 */
export const useClientProfile = () => {
    const { id } = useParams()
    const { idTenant, idBranch } = useTenant()

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
        if (!idTenant || !idBranch || !id) return

        try {
            setLoading(true)
            const data = await ClientService.getClientById(idTenant, idBranch, id)
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
    }, [idTenant, idBranch, id, navigate])

    // Deletar cliente
    const deleteClient = async () => {
        if (!idTenant || !idBranch) return

        try {
            setIsDeleting(true)
            const user = getAuthUser()
            const userName = user?.displayName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email) || 'Usuário Atual';
            await ClientService.deleteClient(idTenant, idBranch, user?.uid, id, userName)
            toast.success("Cliente excluído com sucesso.")
            navigate(-1)
        } catch (error) {
            console.error("Erro ao excluir cliente:", error)
            toast.error(error.message || "Erro ao excluir cliente.")
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        if (idTenant && idBranch && id) {
            loadClient()
        }
    }, [idTenant, idBranch, id, loadClient])

    return {
        client,
        loading,
        activeTab,
        setActiveTab,
        refreshData: loadClient,
        handleDelete: deleteClient,
        isDeleting,
        idTenant,
        idBranch
    }
}
