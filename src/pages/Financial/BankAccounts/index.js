import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { BankAccountFormVisual } from "./BankAccountFormVisual"
import { BankAccountListItem } from "./BankAccountListItem"
import { useBankAccounts } from "./hooks/useBankAccounts"
import PageLoader from "../../../components/Common/PageLoader"
import { useTenant } from "../../../hooks/useTenant"

const BankAccountList = () => {
    document.title = "Contas Bancárias | PGA Admin"
    const { isReady } = useTenant()

    const {
        accounts,
        loading,
        selectedId,
        isAddingNew,
        selectedAccount,
        handleAddClick,
        handleItemClick,
        handleSave,
        handleDelete
    } = useBankAccounts()

    // Sidebar Content
    const SidebarContent = (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && accounts.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : accounts.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                    <i className="mdi mdi-bank-off-outline d-block font-size-24 mb-2"></i>
                    Nenhuma conta cadastrada.
                </div>
            ) : null}
            {accounts.map(item => (
                <BankAccountListItem
                    key={item.id}
                    account={item}
                    active={selectedId === item.id}
                    onClick={() => handleItemClick(item)}
                />
            ))}
        </div>
    )

    // Main Content
    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            {(selectedId || isAddingNew) ? (
                <BankAccountFormVisual
                    initialData={selectedAccount}
                    onSave={handleSave}
                    onCancel={() => { }}
                    onDelete={selectedAccount ? () => handleDelete(selectedAccount.id) : undefined}
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

export default BankAccountList
