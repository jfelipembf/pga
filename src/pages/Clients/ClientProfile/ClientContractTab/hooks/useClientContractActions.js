import { useState } from 'react'
import { toast } from 'react-toastify'
import { ClientContractService } from '../../../../../services/Clients/ClientContract/ClientContractService'
import { SalesService } from '../../../../../services/Sales/SalesService'
import { StaffService } from '../../../../../services/Admin/StaffService'

export const useClientContractActions = (idTenant, idBranch, idClient) => {
    // Estados para os Modais
    const [modals, setModals] = useState({
        adjust: false,
        suspend: false,
        transfer: false,
        cancel: false,
        reactivate: false
    })

    // Contrato selecionado para ação
    const [selectedContract, setSelectedContract] = useState(null)

    // Handlers para abrir/fechar modais
    const toggleModal = (modalName, contract = null) => {
        if (contract) setSelectedContract(contract)
        setModals(prev => ({ ...prev, [modalName]: !prev[modalName] }))
    }

    // Ações de Contrato
    const handleReactivate = async (contract) => {
        try {
            await ClientContractService.reactivate(idTenant, idBranch, contract.id)
            toast.success("Contrato reativado com sucesso!")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao reativar contrato.")
        }
    }

    const handlePrintReceipt = async (idSale) => {
        if (!idSale) {
            toast.error("ID da venda não encontrado para este contrato.")
            return null
        }
        try {
            const sale = await SalesService.getSaleById(idTenant, idBranch, idSale)
            const staff = await StaffService.getStaffById(idTenant, idBranch, sale.idStaff)

            return { sale, staff }
        } catch (error) {
            toast.error("Erro ao carregar dados do recibo.")
            return null
        }
    }

    return {
        modals,
        selectedContract,
        toggleModal,
        handleReactivate,
        handlePrintReceipt
    }
}
