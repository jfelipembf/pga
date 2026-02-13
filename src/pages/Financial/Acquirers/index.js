import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { AcquirerForm } from "./components/AcquirerForm"
import { AcquirerListItem } from "./AcquirerListItem"
import { useAcquirers } from "./hooks/useAcquirers"
import PageLoader from "../../../components/Common/PageLoader"
import { useTenant } from "../../../hooks/useTenant"

const AcquirerList = () => {
    document.title = "Adquirentes | PGA Admin"
    const { isReady } = useTenant()

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
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && acquirers.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : acquirers.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                    <i className="mdi mdi-credit-card-off-outline d-block font-size-24 mb-2"></i>
                    Nenhuma adquirente cadastrada.
                </div>
            ) : null}
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
    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            {(selectedId || isAddingNew) ? (
                <AcquirerForm
                    initialData={selectedAcquirer}
                    onSave={handleSave}
                    onCancel={() => { /* Could add logic to cancel */ }}
                />
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-credit-card-settings-outline mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Máquinas de Cartão</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione uma adquirente para editar ou cadastre uma nova para gerenciar taxas e prazos de recebimento.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Nova Adquirente
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Adquirentes"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Nova Adquirente"
            isLoading={loading && !isReady}
        />
    )
}

export default AcquirerList
