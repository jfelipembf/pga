import React from "react"
import { useContractList } from "./hooks/useContractList"
import ManagementLayout from "../../components/Common/ManagementLayout"
import { ContractFormVisual } from "./ContractFormVisual"
import { ContractListItem } from "./ContractListItem"

const ContractList = () => {
    document.title = "Planos e Contratos | PGA Admin"

    const {
        contracts,
        loading,
        selectedId,
        isAddingNew,
        selectedContract,
        setSelectedId,
        setIsAddingNew,
        handleSave,
        branches
    } = useContractList()

    // Handlers
    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleContractClick = (contract) => {
        setSelectedId(contract.id)
        setIsAddingNew(false)
    }

    const handleCancel = () => {
        setIsAddingNew(false)
        setSelectedId(null)
    }

    // Render Sidebar Content (A Lista)
    const SidebarContent = (
        <div>
            {contracts.length === 0 && !loading && (
                <div className="p-3 text-center text-muted small">
                    Nenhum plano cadastrado.
                </div>
            )}
            {contracts.map(contract => (
                <ContractListItem
                    key={contract.id}
                    contract={contract}
                    active={selectedId === contract.id}
                    onClick={() => handleContractClick(contract)}
                />
            ))}
        </div>
    )

    // Render Main Content (O Formulário)
    const MainContent = (selectedId || isAddingNew) ? (
        <ContractFormVisual
            initialData={selectedContract}
            onSave={handleSave}
            onCancel={handleCancel}
            branches={branches}
        />
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-text-box-search-outline font-size-24 mb-3" style={{ fontSize: '4rem' }}></i>
            <h5>Gestão de Planos de Alunos</h5>
            <p>Selecione um contrato para editar ou crie novos pacotes de serviços.</p>
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Meus Contratos"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Novo Plano"
            isLoading={loading}
        />
    )
}

export default ContractList
