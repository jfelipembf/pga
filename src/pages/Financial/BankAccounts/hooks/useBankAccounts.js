import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { BankAccountService } from '../../../../services/Financial/BankAccountService'
import { toast } from 'react-toastify'

/**
 * Hook para gerenciar a lógica de Contas Bancárias
 */
export const useBankAccounts = () => {
    const { tenantId: idTenant, branchId: idBranch } = useTenant()
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)

    const loadAccounts = useCallback(async () => {
        try {
            setLoading(true)
            const data = await BankAccountService.listAll(idTenant, idBranch)
            setAccounts(data)
        } catch (error) {
            console.error("Erro ao carregar contas bancárias:", error)
            toast.error("Erro ao carregar contas")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        loadAccounts()
    }, [loadAccounts])

    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleItemClick = (item) => {
        setSelectedId(item.id)
        setIsAddingNew(false)
    }

    const handleSave = async (data) => {
        try {
            if (selectedId) {
                await BankAccountService.update(idTenant, idBranch, selectedId, data)
                toast.success("Conta atualizada com sucesso")
            } else {
                await BankAccountService.createAccount(idTenant, idBranch, data)
                toast.success("Conta cadastrada com sucesso")
            }
            setIsAddingNew(false)
            setSelectedId(null)
            await loadAccounts()
        } catch (error) {
            console.error("Erro ao salvar conta bancária:", error)
            toast.error(error.message || "Erro ao salvar conta")
        }
    }

    const selectedAccount = useMemo(() => {
        return accounts.find(a => a.id === selectedId) || null
    }, [accounts, selectedId])

    return {
        accounts,
        loading,
        selectedId,
        isAddingNew,
        selectedAccount,
        handleAddClick,
        handleItemClick,
        handleSave,
        refresh: loadAccounts
    }
}
