import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useAreas } from "./hooks/useAreas"
import { useAreaForm } from "./hooks/useAreaForm"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import PageLoader from "../../../components/Common/PageLoader"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import { AreaListItem } from "./AreaListItem"
import { AreaForm } from "./Components/AreaForm"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import { useTenant } from "../../../hooks/useTenant"

const AreasPage = ({ setBreadcrumbItems }) => {
    document.title = "Gestão de Áreas | PGA Admin"
    const { isReady } = useTenant()

    const {
        filteredAreas: areas,
        loading,
        saving,
        deleting,
        handleSave,
        handleDelete
    } = useAreas()

    const {
        selectedId,
        isAddingNew,
        formData,
        photoFile,
        photoPreview,
        setFormData,
        handleAddClick,
        handleAreaClick,
        handleCancel,
        handlePhotoChange,
        clearSelection
    } = useAreaForm()

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [areaToDelete, setAreaToDelete] = useState(null)

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Áreas", link: "/admin/areas" },
        ]
        setBreadcrumbItems("Gestão de Áreas", breadcrumbItems)
    }, [setBreadcrumbItems])

    const confirmDelete = async () => {
        if (areaToDelete) {
            const ok = await handleDelete(areaToDelete)
            if (ok) {
                setDeleteModalOpen(false)
                setAreaToDelete(null)
                if (selectedId === areaToDelete.id) {
                    clearSelection()
                }
            }
        }
    }

    // Render Sidebar Content (Lista)
    const SidebarContent = (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && areas.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : areas.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-office-building-off-outline d-block font-size-24 mb-2"></i>
                    Nenhuma área cadastrada.
                </div>
            ) : null}
            {areas.map(area => (
                <AreaListItem
                    key={area.id}
                    area={area}
                    active={selectedId === area.id}
                    onClick={() => handleAreaClick(area)}
                />
            ))}
        </div>
    )

    // Render Main Content (Formulário)
    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            <OverlayLoader show={saving} label="Salvando área..." />
            <OverlayLoader show={deleting} label="Excluindo área..." />

            {(selectedId || isAddingNew) && formData ? (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{formData.id ? 'Editar Área' : 'Nova Área'}</h5>
                        <div className="d-flex gap-2">
                            {formData.id && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => {
                                        setAreaToDelete(formData)
                                        setDeleteModalOpen(true)
                                    }}
                                    disabled={saving || deleting}
                                    title="Excluir Área"
                                >
                                    <i className="mdi mdi-trash-can-outline"></i>
                                </button>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={saving}>
                                Cancelar
                            </button>
                            <ButtonLoader
                                loading={saving}
                                color="primary"
                                size="sm"
                                onClick={async () => {
                                    const dataToSave = { ...formData, photoFile }
                                    await handleSave(dataToSave)
                                }}
                            >
                                Salvar
                            </ButtonLoader>
                        </div>
                    </div>

                    <AreaForm
                        value={formData}
                        onChange={setFormData}
                        photoPreview={photoPreview}
                        onPhotoChange={handlePhotoChange}
                    />
                </div>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-office-building-marker-outline mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Ambientes</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione uma área na lista lateral para editar suas configurações ou crie um novo espaço para sua unidade.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Nova Área
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Espaços da Unidade"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Nova Área"
                isLoading={loading && !isReady}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModalOpen}
                toggle={() => setDeleteModalOpen(false)}
                title="Excluir Área"
                description={
                    <span>
                        Tem certeza que deseja excluir <strong>{areaToDelete?.name}</strong>?
                        <br />
                        <small className="text-muted">Essa ação não pode ser desfeita.</small>
                    </span>
                }
                confirmText="Excluir Definitivamente"
                confirmColor="danger"
                loading={deleting}
                onConfirm={confirmDelete}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(AreasPage)
