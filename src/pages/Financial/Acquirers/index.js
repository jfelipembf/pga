import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { AcquirerForm } from "../../../features/financial/components/AcquirerForm"
import { AcquirerListItem } from "./AcquirerListItem"
import { useAcquirers } from "../../../features/financial/hooks/useAcquirers"

const AcquirerList = () => {
    document.title = "Adquirentes | Lexa Admin"

    const {
        acquirers,
        loading,
        selectedId,
        isAddingNew,
        selectedAcquirer,
        handleAddClick,
        handleItemClick,
        handleSave
    } = useAcquirers()

    // Sidebar Content
    const SidebarContent = (
        <div>
            {acquirers.length === 0 && !loading && (
                <div className="p-3 text-center text-muted small">
                    Nenhuma adquirente cadastrada.
                </div>
            )}
            {acquirers.map(item => (
                <AcquirerListItem
                    key={item.id}
                    acquirer={item}
                    active={selectedId === item.id}
                    onClick={() => handleItemClick(item)}
                />
            ))}
        </div>
    )

    // Main Content
    const MainContent = (selectedId || isAddingNew) ? (
        <AcquirerForm
            initialData={selectedAcquirer}
            onSave={handleSave}
            onCancel={() => { /* Could add logic to cancel */ }}
        />
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-credit-card-settings-outline mb-3" style={{ fontSize: '4rem' }}></i>
            <h5>Gestão de Máquinas de Cartão</h5>
            <p>Selecione uma adquirente para editar ou cadastre uma nova para gerenciar taxas.</p>
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Adquirentes"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Nova Adquirente"
            isLoading={loading}
        />
    )
}

export default AcquirerList
