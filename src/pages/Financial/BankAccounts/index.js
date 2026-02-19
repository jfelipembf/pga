import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { useBankAccountData } from "./hooks/useBankAccountData"
import { useBankAccountOperations } from "./hooks/useBankAccountOperations"
import { useBankAccountSelection } from "./hooks/useBankAccountSelection"
import { BankAccountList } from "./components/BankAccountList"
import { BankAccountForm } from "./components/BankAccountForm"
import { useTenant } from "../../../hooks/useTenant"
import { useAuth } from "../../../hooks/useAuth"

const BankAccountsPage = () => {
    document.title = "Contas Bancárias | PGA Admin"
    const { isReady } = useTenant()

    // 1. Data Hook
    const { accounts, loading, refresh } = useBankAccountData()

    // 2. Selection Hook
    const {
        selectedId,
        isAddingNew,
        selectedAccount,
        handleAddClick,
        handleItemClick,
        clearSelection
    } = useBankAccountSelection(accounts)

    const { user } = useAuth();
    const { createAccount, updateAccount, deleteAccount } = useBankAccountOperations({
        onSuccess: () => {
            refresh()
            clearSelection()
        }
    })

    // Handlers
    const handleSave = async (data) => {
        if (selectedAccount) {
            await updateAccount(selectedAccount.id, data)
        } else {
            // Include user info for the snapshot if needed by the form, or let service handle it
            await createAccount({ ...data, userName: user?.displayName || user?.email })
        }
    }

    const handleDeleteClick = async () => {
        if (selectedAccount) {
            await deleteAccount(selectedAccount.id)
        }
    }

    // Layout
    const SidebarContent = (
        <BankAccountList
            accounts={accounts}
            loading={loading}
            selectedId={selectedId}
            onSelect={handleItemClick}
        />
    )

    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            {(selectedId || isAddingNew) ? (
                <BankAccountForm
                    initialData={selectedAccount}
                    onSave={handleSave}
                    onCancel={clearSelection}
                    onDelete={selectedAccount ? handleDeleteClick : undefined}
                />
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-bank-outline mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Contas e Caixas</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione uma conta para editar ou cadastre uma nova para gerenciar seus saldos e conciliações.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Nova Conta
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Contas / Caixas"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Nova Conta"
            isLoading={loading && !isReady}
        />
    )
}

export default BankAccountsPage
