import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useCatalog } from "./hooks/useCatalog"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

const CatalogPage = ({ setBreadcrumbItems }) => {
    document.title = "Catálogo de Produtos e Serviços | PGA Admin"

    const {
        filteredCatalog: items,
        loading,
        selectedItem,
        handleDelete,
    } = useCatalog()

    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Catálogo", link: "/admin/catalog" },
        ]
        setBreadcrumbItems("Catálogo de Produtos e Serviços", breadcrumbItems)
    }, [setBreadcrumbItems])

    // Handlers
    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleItemClick = (item) => {
        setSelectedId(item.id)
        setIsAddingNew(false)
    }


    const confirmDelete = async () => {
        if (itemToDelete) {
            const ok = await handleDelete(itemToDelete)
            if (ok) {
                setDeleteModalOpen(false)
                setItemToDelete(null)
            }
        }
    }

    // Render Sidebar Content (Lista)
    const SidebarContent = (
        <div>
            {items.length === 0 && !loading && (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-package-variant-closed d-block font-size-24 mb-2"></i>
                    Nenhum item cadastrado.
                </div>
            )}
            {items.map(item => (
                <div
                    key={item.id}
                    className={`p-3 border-bottom cursor-pointer ${selectedId === item.id ? 'bg-light' : ''
                        }`}
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                            <h6 className="mb-1">{item.name}</h6>
                            {item.category && (
                                <p className="mb-1 small text-muted">{item.category}</p>
                            )}
                            {item.sku && (
                                <small className="text-muted">SKU: {item.sku}</small>
                            )}
                        </div>
                        <div className="text-end">
                            {item.price && (
                                <div className="fw-bold text-primary">
                                    R$ {Number(item.price).toFixed(2)}
                                </div>
                            )}
                            {item.stock !== undefined && (
                                <small className="text-muted">Estoque: {item.stock}</small>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    // Render Main Content (Formulário)
    const MainContent = (selectedId || isAddingNew) ? (
        <div>
            <h5>Formulário de Item</h5>
            <p className="text-muted">Formulário em desenvolvimento - use os campos básicos abaixo:</p>
            {/* TODO: Implementar ProductForm ou ServiceForm baseado no tipo */}
            <div className="alert alert-info">
                Item selecionado: {selectedItem?.name || 'Novo item'}
            </div>
        </div>
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-package-variant mb-3" style={{ fontSize: '5rem', opacity: 0.2 }}></i>
            <h5 className="fw-bold">Catálogo de Produtos e Serviços</h5>
            <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                Selecione um item na lista lateral para editar ou crie um novo produto/serviço.
            </p>
            <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                Criar Novo Item
            </button>
        </div>
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Itens do Catálogo"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Novo Item"
                isLoading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModalOpen}
                title="Excluir Item"
                message={
                    <span>
                        Tem certeza que deseja excluir <strong>{itemToDelete?.name}</strong>?
                        <br />
                        <small className="text-muted">Essa ação não pode ser desfeita.</small>
                    </span>
                }
                confirmText="Excluir Definitivamente"
                confirmColor="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(CatalogPage)
