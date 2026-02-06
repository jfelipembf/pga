import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { BankAccountFormVisual } from "./BankAccountFormVisual"
import { BankAccountListItem } from "./BankAccountListItem"
import { useBankAccounts } from "./hooks/useBankAccounts"

const BankAccountList = () => {
    document.title = "Contas Bancárias | PGA Admin"

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
        <div>
            {accounts.length === 0 && !loading && (
                <div className="p-3 text-center text-muted small">
                    Nenhuma conta cadastrada.
                </div>
            )}
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
    const MainContent = (selectedId || isAddingNew) ? (
        <BankAccountFormVisual
            initialData={selectedAccount}
            onSave={handleSave}
            onCancel={() => { }}
            onDelete={selectedAccount ? () => handleDelete(selectedAccount.id) : undefined}
        />
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-bank-outline mb-3" style={{ fontSize: '4rem' }}></i>
            <h5>Gestão de Contas e Caixas</h5>
            <p>Selecione uma conta para editar ou cadastre uma nova para gerenciar seus saldos.</p>
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Contas / Caixas"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Nova Conta"
            isLoading={loading}
        />
    )
}

export default BankAccountList
