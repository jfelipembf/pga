
import React from "react"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { AcquirerForm } from "./components/AcquirerForm"
import { AcquirerList } from "./components/AcquirerList"
import { useAcquirerData } from "./hooks/useAcquirerData"
import { useAcquirerSelection } from "./hooks/useAcquirerSelection"
import { useAcquirerOperations } from "./hooks/useAcquirerOperations"
import { useTenant } from "../../../hooks/useTenant"

const AcquirersPage = () => {
    document.title = "Adquirentes | PGA Admin"
    const { isReady } = useTenant()

    const { acquirers, loading, refresh } = useAcquirerData()

    const {
        selectedId,
        isAddingNew,
        selectedAcquirer,
        handleAddClick,
        handleItemClick,
        clearSelection,
        setSelectionById
    } = useAcquirerSelection(acquirers)

    const { saveAcquirer } = useAcquirerOperations({
        onSuccess: (savedId) => {
            refresh()
            if (savedId) setSelectionById(savedId)
        }
    })

    const handleSave = async (data) => {
        await saveAcquirer(data, selectedId)
    }

    const SidebarContent = (
        <AcquirerList
            acquirers={acquirers}
            loading={loading}
            selectedId={selectedId}
            onSelect={handleItemClick}
        />
    )

    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            {(selectedId || isAddingNew) ? (
                <AcquirerForm
                    initialData={selectedAcquirer}
                    onSave={handleSave}
                    onCancel={clearSelection}
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

export default AcquirersPage
