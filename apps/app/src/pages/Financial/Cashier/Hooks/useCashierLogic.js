import { useLoading } from "../../../../hooks/useLoading"
import { useCashierStatus } from "./useCashierStatus"
import { useCashierTransactions } from "./useCashierTransactions"
import { useCashierExpenses } from "./useCashierExpenses"
import { useCashierOperations } from "./useCashierOperations"

export const useCashierLogic = () => {
    const { isLoading, withLoading } = useLoading()

    // Status Logic
    const {
        cashierStatus,
        loadStatus,
        isOpen,
        session
    } = useCashierStatus({ withLoading })

    // Transactions Logic
    const {
        transactions,
        setDateRange,
        startDate,
        endDate,
        loadTransactions,
        filteredTransactions,
        totals,
        isPrinting,
        setIsPrinting
    } = useCashierTransactions({ withLoading })

    // Expenses Logic
    const {
        expenseModalOpen,
        toggleExpenseModal,
        expenseForm,
        handleExpenseChange,
        handleExpenseSubmit
    } = useCashierExpenses({ loadTransactions, withLoading })

    // Operations Logic
    const {
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
    } = useCashierOperations({ loadStatus, cashierStatus, totals, withLoading })

    return {
        isLoading,
        isPrinting,
        setIsPrinting,
        startDate,
        endDate,
        setDateRange,
        transactions,
        cashierStatus,
        isOpen,
        session,
        expenseModalOpen,
        toggleExpenseModal,
        openCashierModalOpen,
        setOpenCashierModalOpen,
        closeCashierModalOpen,
        setCloseCashierModalOpen,
        expenseForm,
        handleExpenseChange,
        handleExpenseSubmit,
        openingBalance,
        setOpeningBalance,
        handleOpenSubmit,
        closingObservation,
        setClosingObservation,
        handleCloseSubmit,
        filteredTransactions,
        totals,
        loadStatus,
        loadTransactions
    }
}
