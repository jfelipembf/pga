import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { PayableService } from '../../../../services/Financial/PayableService'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../hooks/useAuth'

/**
 * Hook para gerenciar a lógica de Contas a Pagar (Payables)
 */
export const usePayables = () => {
    const { idTenant, idBranch, isReady } = useTenant()

    // Obtenção do Usuário (Centralizado)
    const { user } = useAuth()

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

    // Paginação
    const [fetchLimit, setFetchLimit] = useState(50)

    // Reset do limite ao mudar filtros
    useEffect(() => {
        setFetchLimit(50);
    }, [filterStatus, filterCategory, filterStartDate, filterEndDate]);

    const loadPayables = useCallback(async () => {
        if (!isReady) return // Prevent fetch before tenant context is ready

        try {
            setLoading(true)

            const filters = {
                status: filterStatus,
                category: filterCategory,
                startDate: filterStartDate,
                endDate: filterEndDate
            }

            // Usando limite dinâmico
            const data = await PayableService.listWithFilters(idTenant, idBranch, filters, fetchLimit)
            setPayables(data)
        } catch (error) {
            console.error("Erro ao carregar contas a pagar:", error)
            toast.error("Erro ao carregar contas a pagar")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filterStatus, filterCategory, filterStartDate, filterEndDate, fetchLimit, isReady])

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
        try {
            if (selectedPayable) {
                await PayableService.updatePayable(idTenant, idBranch, user.uid, selectedPayable.id, {
                    ...data,
                    userName: user.displayName || user.email // Garante Snapshot
                })
                toast.success("Conta atualizada com sucesso")
            } else {
                await PayableService.createPayable(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email // Garante Snapshot
                })
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
            await PayableService.payBill(idTenant, idBranch, user.uid, id, {
                ...paymentData,
                userName: user.displayName || user.email // Garante Snapshot
            })
            toast.success("Pagamento realizado com sucesso")
            await loadPayables()
        } catch (error) {
            console.error("Erro ao realizar pagamento:", error)
            toast.error(error.message || "Erro ao realizar pagamento")
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir esta conta?")) return
        try {
            await PayableService.deletePayable(idTenant, idBranch, user.uid, id)
            toast.success("Conta excluída com sucesso")
            await loadPayables()
        } catch (error) {
            console.error("Erro ao excluir conta:", error)
            toast.error(error.message || "Erro ao excluir conta")
        }
    }

    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50);
    }, []);

    // Lógica de Filtro (Frontend: Apenas Busca Textual, pois o resto já veio filtrado do back)
    const filteredPayables = useMemo(() => {
        return payables.filter(item => {
            if (!searchTerm) return true;

            const description = item.description || item.title || ''
            const supplier = item.supplier || ''

            return description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }, [payables, searchTerm])

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
        loading: loading || !isReady, // Força loading enquanto o tenant não estiver pronto
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
        handleDelete,
        handleLoadMore,
        hasMore: payables.length >= fetchLimit && payables.length > 0, // Verifica se carregou o limite (sinal de que tem mais), e se tem dados
        refresh: loadPayables
    }
}
