import React, { useEffect } from "react"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useContractList } from "./hooks/useContractList"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import { ContractFormVisual } from "./components/ContractFormVisual"
import { ContractListItem } from "./components/ContractListItem"
import { useTenant } from "../../../hooks/useTenant"
import PageLoader from "../../../components/Common/PageLoader"


const ContractList = ({ setBreadcrumbItems }) => {
    document.title = "Planos e Contratos | PGA Admin"
    const { isReady } = useTenant()

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Financeiro", link: "#" },
            { title: "Planos e Contratos", link: "/financial/contracts" },
        ]
        setBreadcrumbItems("Planos e Contratos", breadcrumbItems)
    }, [setBreadcrumbItems])

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
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && contracts.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : contracts.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-text-box-remove-outline d-block font-size-24 mb-2"></i>
                    Nenhum plano cadastrado.
                </div>
            ) : null}
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
    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            {/* Aqui poderíamos adicionar OverlayLoader se tivéssemos estados de salvamento/exclusão no hook */}

            {(selectedId || isAddingNew) ? (
                <ContractFormVisual
                    initialData={selectedContract}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    branches={branches}
                />
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-text-box-search-outline mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Planos de Alunos</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione um contrato para editar ou crie novos pacotes de serviços para sua unidade.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Novo Plano
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <ManagementLayout
            sidebarTitle="Meus Contratos"
            sidebarContent={SidebarContent}
            mainContent={MainContent}
            onAddClick={handleAddClick}
            addLabel="Novo Plano"
            isLoading={loading && !isReady}
        />
    )
}

export default connect(null, { setBreadcrumbItems })(ContractList)
