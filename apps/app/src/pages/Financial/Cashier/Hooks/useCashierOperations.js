import { useState } from "react"
import { useToast } from "../../../../components/Common/ToastProvider"
import { openCashier, closeCashier } from "../../../../services/Financial/index"

export const useCashierOperations = ({ loadStatus, cashierStatus, totals, withLoading }) => {
    const toast = useToast()

    const [openCashierModalOpen, setOpenCashierModalOpen] = useState(false)
    const [closeCashierModalOpen, setCloseCashierModalOpen] = useState(false)
    const [openingBalance, setOpeningBalance] = useState("")
    const [closingObservation, setClosingObservation] = useState("")

    const handleOpenSubmit = async (e) => {
        e.preventDefault()
        const opening = Number(openingBalance)

        if (!Number.isFinite(opening) || opening < 0) {
            toast.show({ title: "Saldo inicial inválido", color: "warning" })
            return
        }

        try {
            const action = async () => {
                await openCashier({ openingBalance: opening })
                if (loadStatus) await loadStatus()
                toast.show({ title: "Caixa aberto com sucesso", color: "success" })
                setOpenCashierModalOpen(false)
                setOpeningBalance("")
            }

            if (withLoading) await withLoading("openCashier", action)
            else await action()
        } catch (err) {
            console.error(err)
            toast.show({
                title: "Erro ao abrir caixa",
                description: err?.message,
                color: "danger",
            })
        }
    }

    const handleCloseSubmit = async (e) => {
        e.preventDefault()
        if (!cashierStatus?.session?.id) return

        try {
            const action = async () => {
                const opening = Number(cashierStatus.session?.openingBalance || 0)
                const closingBalance = Number((totals?.revenue || 0) - (totals?.expenses || 0) + opening)

                await closeCashier({
                    idSession: cashierStatus.session.id,
                    closingBalance,
                    observations: closingObservation,
                })

                if (loadStatus) await loadStatus()
                toast.show({ title: "Caixa fechado com sucesso", color: "success" })
                setCloseCashierModalOpen(false)
                setClosingObservation("")
            }

            if (withLoading) await withLoading("closeCashier", action)
            else await action()
        } catch (err) {
            console.error(err)
            toast.show({
                title: "Erro ao fechar caixa",
                description: err?.message,
                color: "danger",
            })
        }
    }

    return {
        openCashierModalOpen,
        setOpenCashierModalOpen,
        closeCashierModalOpen,
        setCloseCashierModalOpen,
        openingBalance,
        setOpeningBalance,
        closingObservation,
        setClosingObservation,
        handleOpenSubmit,
        handleCloseSubmit
    }
}
