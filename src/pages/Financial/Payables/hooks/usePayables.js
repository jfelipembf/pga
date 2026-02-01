import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { PayableService } from '../../../../services/Financial/PayableService'
import { toast } from 'react-toastify'

/**
 * Hook para gerenciar a lógica de Contas a Pagar (Payables)
 */
export const usePayables = () => {
    const { tenantId: idTenant, branchId: idBranch } = useTenant()

    // Obtenção do Usuário (Padrão LocalStorage)
    const user = useMemo(() => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }, [])

    const [payables, setPayables] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [selectedPayable, setSelectedPayable] = useState(null)

    // Filtros
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterStartDate, setFilterStartDate] = useState('')
    const [filterEndDate, setFilterEndDate] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const loadPayables = useCallback(async () => {
        try {
            setLoading(true)
            const data = await PayableService.listAll(idTenant, idBranch)
            setPayables(data)
        } catch (error) {
            console.error("Erro ao carregar contas a pagar:", error)
            toast.error("Erro ao carregar contas a pagar")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        loadPayables()
    }, [loadPayables])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedPayable(null)
    }

    const handleEdit = (item) => {
        setSelectedPayable(item)
        setModal(true)
    }

    const handleSave = async (data) => {
        console.log("usePayables: handleSave chamado", data);
        try {
            if (selectedPayable) {
                console.log("usePayables: Atualizando...");
                await PayableService.updatePayable(idTenant, idBranch, user.uid, selectedPayable.id, data)
                toast.success("Conta atualizada com sucesso")
            } else {
                console.log("usePayables: Criando...", { idTenant, idBranch, uid: user?.uid });
                await PayableService.createPayable(idTenant, idBranch, user.uid, data)
                toast.success("Conta registrada com sucesso")
            }
            toggleModal()
            await loadPayables()
        } catch (error) {
            console.error("Erro ao salvar conta:", error)
            toast.error("Erro ao salvar conta: " + error.message)
        }
    }

    const handlePay = async (id, paymentData = {}) => {
        try {
            await PayableService.payBill(idTenant, idBranch, user.uid, id, paymentData)
            toast.success("Pagamento realizado com sucesso")
            await loadPayables()
        } catch (error) {
            console.error("Erro ao realizar pagamento:", error)
            toast.error(error.message || "Erro ao realizar pagamento")
        }
    }

    // Lógica de Filtro
    const filteredPayables = useMemo(() => {
        return payables.filter(item => {
            const description = item.description || item.title || ''
            const supplier = item.supplier || ''
            const category = item.category || 'Geral'
            const dueDate = item.dueDate ? new Date(item.dueDate) : null

            // 1. Busca textual (Descrição ou Fornecedor)
            const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.toLowerCase().includes(searchTerm.toLowerCase())

            // 2. Status
            const matchesStatus = filterStatus === 'all' || item.status === filterStatus

            // 3. Categoria
            const matchesCategory = filterCategory === 'all' || category === filterCategory

            // 4. Intervalo de Datas (Vencimento)
            let matchesDate = true
            if (dueDate) {
                if (filterStartDate) {
                    matchesDate = matchesDate && new Date(dueDate) >= new Date(filterStartDate)
                }
                if (filterEndDate) {
                    matchesDate = matchesDate && new Date(dueDate) <= new Date(filterEndDate)
                }
            }

            return matchesSearch && matchesStatus && matchesCategory && matchesDate
        })
    }, [payables, searchTerm, filterStatus, filterCategory, filterStartDate, filterEndDate])

    // Totais
    const totals = useMemo(() => {
        return {
            pending: payables.filter(p => p.status === 'open').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            overdue: payables.filter(p => p.status === 'overdue').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            paid: payables.filter(p => p.status === 'paid').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            countPending: payables.filter(p => p.status === 'open').length,
            countOverdue: payables.filter(p => p.status === 'overdue').length
        }
    }, [payables])

    return {
        idTenant,
        idBranch,
        loading,
        modal,
        selectedPayable,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        filterStartDate,
        setFilterStartDate,
        filterEndDate,
        setFilterEndDate,
        searchTerm,
        setSearchTerm,
        filteredPayables,
        totals,
        toggleModal,
        handleEdit,
        handleSave,
        handlePay,
        refresh: loadPayables
    }
}
