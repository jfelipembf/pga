import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useTenant } from "../../../../../hooks/useTenant"
import { ReceivableService } from "../../../../../services/Financial/ReceivableService"
import { SalesService } from "../../../../../services/Sales/SalesService"
import { ClientContractService } from "../../../../../services/Clients/ClientContract/ClientContractService"
import { toast } from "react-toastify"

/**
 * Hook para gerenciar os dados financeiros de um cliente específico.
 * Focado na visualização de histórico de vendas e resumo de indicadores.
 */
export const useClientFinancial = () => {
    const { id } = useParams() // Client ID from URL
    const { idTenant, idBranch } = useTenant()

    const [summary, setSummary] = useState(null)
    const [receivables, setReceivables] = useState([])
    const [sales, setSales] = useState([])
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)

    const loadFinancialData = useCallback(async () => {
        // Wait for real IDs
        if (!idTenant || !idBranch || !id) return

        try {
            setLoading(true)

            // Buscar dados em paralelo para melhor performance
            const [summaryData, receivablesData, salesData, contractsData] = await Promise.all([
                ReceivableService.getSummaryByClient(idTenant, idBranch, id),
                ReceivableService.listByClient(idTenant, idBranch, id),
                SalesService.listByClient(idTenant, idBranch, id),
                ClientContractService.listByClient(idTenant, idBranch, id)
            ])

            setSummary(summaryData)
            setReceivables(receivablesData)
            setSales(salesData)
            setContracts(contractsData)
        } catch (error) {
            console.error("Erro ao carregar dados financeiros do cliente:", error)
            toast.error("Erro ao carregar informações financeiras.")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, id])

    useEffect(() => {
        if (idTenant && idBranch && id) {
            loadFinancialData()
        }
    }, [idTenant, idBranch, id, loadFinancialData])

    return {
        summary,
        receivables,
        sales,
        contracts,
        loading,
        refreshData: loadFinancialData
    }
}
