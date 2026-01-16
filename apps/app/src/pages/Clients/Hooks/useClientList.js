import { useState, useEffect } from "react"
import { listClients } from "../../../services/Clients/index"
import { listClientContractsByClient } from "../../../services/ClientContracts"
import { useLoading } from "../../../hooks/useLoading"

export const useClientList = () => {
    const [clients, setClients] = useState([])
    const [contractsByClient, setContractsByClient] = useState({})
    const { isLoading, withLoading } = useLoading()

    useEffect(() => {
        const load = async () => {
            try {
                await withLoading("page", async () => {
                    const data = await listClients()
                    setClients(data)

                    // Buscar contratos de cada cliente
                    const contractsPromises = data.map(async client => {
                        const contracts = await listClientContractsByClient(client.id)
                        return { clientId: client.id, contracts }
                    })
                    const contractsResults = await Promise.all(contractsPromises)
                    const mapContracts = contractsResults.reduce((acc, { clientId, contracts }) => {
                        acc[clientId] = contracts
                        return acc
                    }, {})
                    setContractsByClient(mapContracts)
                })
            } catch (e) {
                console.error("Erro ao carregar clientes", e)
            }
        }
        load()
    }, [withLoading]) // Added dependency

    return {
        clients,
        setClients,
        contractsByClient,
        loading: isLoading("page"),
        isLoading
    }
}
