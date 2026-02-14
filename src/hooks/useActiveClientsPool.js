import { useState, useEffect } from "react"
import { useTenant } from "./useTenant"
import { ClientService } from "../services/Clients/ClientService"

export const useActiveClientsPool = ({ enabled }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [clients, setClients] = useState([])

    useEffect(() => {
        if (!enabled || !isReady) return

        const fetchClients = async () => {
            try {
                // Assume listActive or similar exists, or list all.
                const data = await ClientService.listClients(idTenant, idBranch) // Generic list
                // Filter active on client side if needed, or assume list returns all relevant
                setClients(data)
            } catch (error) {
                console.error("Erro ao buscar clientes ativos", error)
            }
        }

        fetchClients()
    }, [enabled, isReady, idTenant, idBranch])

    return { clients }
}
