import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useTenant } from "../../../../hooks/useTenant"
import { ReceivableService } from "../../../../services/Financial/ReceivableService"
import { SalesService } from "../../../../services/Sales/SalesService"
import { toast } from "react-toastify"

/**
 * Hook para gerenciar os dados financeiros de um cliente específico.
 */
export const useClientFinancial = () => {
    const { id } = useParams() // Client ID from URL
    const { tenantId, branchId } = useTenant()


    const [summary, setSummary] = useState(null)
    const [receivables, setReceivables] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)

    const loadFinancialData = useCallback(async () => {
        // Wait for real IDs
        if (!tenantId || !branchId || !id) return

        try {
            setLoading(true)

            // Buscar dados em paralelo para melhor performance
            const [summaryData, receivablesData, salesData] = await Promise.all([
                ReceivableService.getSummaryByClient(tenantId, branchId, id),
                ReceivableService.listByClient(tenantId, branchId, id),
                SalesService.listByClient(tenantId, branchId, id)
            ])

            setSummary(summaryData)
            setReceivables(receivablesData)
            setSales(salesData)
        } catch (error) {
            console.error("Erro ao carregar dados financeiros do cliente:", error)
            toast.error("Erro ao carregar informações financeiras.")
        } finally {
            setLoading(false)
        }
    }, [tenantId, branchId, id])

    useEffect(() => {
        if (tenantId && branchId && id) {
            loadFinancialData()
        }
    }, [tenantId, branchId, id, loadFinancialData])

    return {
        summary,
        receivables,
        sales,
        loading,
        refreshData: loadFinancialData
    }
}
