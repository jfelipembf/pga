import { useState, useEffect, useCallback } from "react"
import { useSelector } from "react-redux"
import { ClientService } from "../../../services/Clients/ClientService"
import { toast } from "react-toastify"

export const useClientList = () => {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    // Obter tenant e branch ativos do Redux (já com IDs resolvidos)
    const { activeTenant, activeBranch, loading: loadingTenant } = useSelector(state => state.Tenant)

    const refreshClients = useCallback(async () => {
        // Só busca se tiver os IDs reais carregados
        if (!activeTenant?.idTenant || !activeBranch?.idBranch) {
            return
        }

        try {

            setLoading(true)
            const data = await ClientService.listClients(activeTenant.idTenant, activeBranch.idBranch)

            setClients(data)
        } catch (error) {
            console.error("Erro ao carregar clientes:", error)
            toast.error("Erro ao carregar lista de clientes.")
        } finally {
            setLoading(false)
        }
    }, [activeTenant, activeBranch])

    // Carrega clientes quando tenant/branch mudarem ou forem carregados
    useEffect(() => {
        if (!loadingTenant && activeTenant?.idTenant && activeBranch?.idBranch) {
            refreshClients()
        }
    }, [activeTenant, activeBranch, loadingTenant, refreshClients])

    return {
        clients,
        setClients,
        loading: loading || loadingTenant, // Combina loading
        refreshClients
    }
}
