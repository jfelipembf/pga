import { useState, useCallback } from "react"
import { useToast } from "../../../../components/Common/ToastProvider"
import { addExpense } from "../../../../services/Financial/index"

export const useCashierExpenses = ({ loadTransactions, withLoading }) => {
    const toast = useToast()

    const [expenseModalOpen, setExpenseModalOpen] = useState(false)
    const [expenseForm, setExpenseForm] = useState({
        description: "",
        category: "",
        method: "Dinheiro",
        amount: "",
    })

    const toggleExpenseModal = useCallback(() => {
        setExpenseModalOpen((prev) => !prev)
        setExpenseForm({
            description: "",
            category: "",
            method: "Dinheiro",
            amount: "",
        })
    }, [])

    const handleExpenseChange = (e) => {
        const { name, value } = e.target
        setExpenseForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleExpenseSubmit = async (e) => {
        e.preventDefault()
        const amount = Number(expenseForm.amount)

        if (!Number.isFinite(amount) || amount <= 0) {
            toast.show({ title: "Informe um valor válido", color: "warning" })
            return
        }

        try {
            const submitFn = async () => {
                await addExpense({
                    amount,
                    description: expenseForm.description,
                    category: expenseForm.category || "Despesa",
                    method: expenseForm.method,
                    metadata: {
                        registeredBy: "cashier",
                        registeredAt: new Date().toISOString(),
                    },
                })

                if (loadTransactions) await loadTransactions()
                toast.show({ title: "Despesa registrada", color: "success" })
                toggleExpenseModal()
            }

            if (withLoading) await withLoading("expense", submitFn)
            else await submitFn()
        } catch (err) {
            console.error("Erro ao registrar despesa", err)
            toast.show({ title: "Erro ao registrar despesa", color: "danger" })
        }
    }

    return {
        expenseModalOpen,
        toggleExpenseModal,
        expenseForm,
        handleExpenseChange,
        handleExpenseSubmit
    }
}
