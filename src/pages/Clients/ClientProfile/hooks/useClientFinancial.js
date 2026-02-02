import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useTenant } from "../../../../hooks/useTenant"
import { ReceivableService } from "../../../../services/Financial/ReceivableService"
import { SalesService } from "../../../../services/Sales/SalesService"
import { ClientContractService } from "../../../../features/clients/services/ClientContractService"
import { toast } from "react-toastify"

/**
 * Hook para gerenciar os dados financeiros de um cliente específico.
 */
export const useClientFinancial = () => {
    const { id } = useParams() // Client ID from URL
    const { idTenant, idBranch } = useTenant()


    const [summary, setSummary] = useState(null)
    const [receivables, setReceivables] = useState([])
    const [sales, setSales] = useState([])
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedReceivable, setSelectedReceivable] = useState(null)
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)

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

    const handleSettle = async (settlementData) => {
        try {
            const { id: idReceivable, totalAmount, idBankAccount, settlementDate, notes } = settlementData;
            const authUser = JSON.parse(localStorage.getItem("authUser"))

            await ReceivableService.settleReceivable(idTenant, idBranch, authUser.uid, idReceivable, {
                amount: totalAmount,
                idBankAccount: idBankAccount,
                method: settlementData.paymentMethod,
                settlementDate: settlementDate,
                notes: notes
            })

            toast.success("Pagamento recebido com sucesso!")
            loadFinancialData() // Recarrega os dados para atualizar o resumo e as listas
        } catch (error) {
            console.error("Erro ao quitar título:", error)
            toast.error("Erro ao processar o pagamento.")
        }
    }

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
        refreshData: loadFinancialData,
        // UI State for settlement
        selectedReceivable,
        setSelectedReceivable,
        isSettlementModalOpen,
        setIsSettlementModalOpen,
        handleSettle
    }
}
