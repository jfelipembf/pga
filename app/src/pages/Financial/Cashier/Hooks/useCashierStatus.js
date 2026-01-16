import { useState, useCallback } from "react"
import { useToast } from "../../../../components/Common/ToastProvider"
import { checkCashierStatus } from "../../../../services/Financial/index"

export const useCashierStatus = ({ withLoading }) => {
    const toast = useToast()
    const [cashierStatus, setCashierStatus] = useState({ isOpen: false, session: null })

    const loadStatus = useCallback(async () => {
        try {
            const fetch = async () => {
                const status = await checkCashierStatus()
                setCashierStatus(status)
            }

            if (withLoading) await withLoading("page", fetch)
            else await fetch()
        } catch (e) {
            console.error("Erro ao verificar status do caixa", e)
            toast.show({ title: "Erro ao verificar status do caixa", color: "danger" })
        }
    }, [toast, withLoading])

    const isOpen = Boolean(cashierStatus?.isOpen)
    const session = cashierStatus?.session || {}

    return {
        cashierStatus,
        setCashierStatus,
        loadStatus,
        isOpen,
        session
    }
}
