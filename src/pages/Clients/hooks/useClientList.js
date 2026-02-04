import { useState, useEffect, useCallback } from "react"
import { useTenant } from "../../../hooks/useTenant"
import { ClientService } from "../../../features/clients"
import { toast } from "react-toastify"

export const useClientList = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    const refreshClients = useCallback(async () => {
        if (!isReady) return

        try {

            setLoading(true)
            const data = await ClientService.listClients(idTenant, idBranch)

            setClients(data)
        } catch (error) {
            console.error("Erro ao carregar clientes:", error)
            toast.error("Erro ao carregar lista de clientes.")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady])

    // Carrega clientes quando tenant/branch mudarem ou forem carregados
    useEffect(() => {
        if (isReady) {
            refreshClients()
        }
    }, [isReady, refreshClients])

    const [modalOpen, setModalOpen] = useState(false)

    // Handlers
    const handleModalSubmit = async (values) => {
        // Lógica de submit será implementada quando tivermos o NewClientModal
        console.log("Submit values:", values)
        setModalOpen(false)
        await refreshClients()
    }

    const handleRowClick = (client, navigate) => {
        if (navigate && idTenant && idBranch) {
            navigate(`/${idTenant}/${idBranch}/clients/${client.id}`)
        }
    }

    return {
        clients,
        setClients,
        loading,
        refreshClients,
        // UI State
        modalOpen,
        setModalOpen,
        handleModalSubmit,
        handleRowClick
    }
}

