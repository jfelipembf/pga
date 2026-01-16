import { useState, useEffect } from "react"
import { useLoading } from "../../../hooks/useLoading"
import { loadCrmSegment } from "../../../services/CRM/crm.service"
import { useToast } from "../../../components/Common/ToastProvider"

export const useCrmData = (activeSegment, dateRange) => {
    const [clients, setClients] = useState([])
    const { isLoading, withLoading } = useLoading()
    const toast = useToast()
    const [startDate, endDate] = dateRange || [null, null]

    useEffect(() => {
        const load = async () => {
            if (!activeSegment) return

            // MANUAL SEARCH ENFORCED:
            // Para segmentos historiques (suspenso, cancelado, inativo),
            // só buscar se houver filtro de data (botão buscar).
            const isManualSearch = ['suspended', 'canceled', 'inactive'].includes(activeSegment)
            if (isManualSearch && (!startDate || !endDate)) {
                setClients([])
                return
            }

            try {
                await withLoading("crm-list", async () => {
                    const data = await loadCrmSegment(activeSegment, startDate, endDate)
                    setClients(data)
                })
            } catch (error) {
                console.error("Erro ao carregar CRM:", error)
                toast.show({
                    title: "Erro ao carregar dados",
                    description: error.message,
                    color: "danger"
                })
            }
        }

        load()
    }, [activeSegment, startDate, endDate, withLoading, toast])

    return {
        clients,
        loading: isLoading("crm-list"),
        setClients // Expose setter for optimistic updates if needed
    }
}
