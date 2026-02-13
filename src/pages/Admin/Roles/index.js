import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useRoles } from "./hooks/useRoles"
import { useRoleForm } from "./hooks/useRoleForm"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import PageLoader from "../../../components/Common/PageLoader"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import { RoleForm, RoleListItem } from "./Components"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import { useTenant } from "../../../hooks/useTenant"

const RolesPage = ({ setBreadcrumbItems }) => {
    document.title = "Gestão de Funções | PGA Admin"
    const { isReady } = useTenant()

    const {
        filteredRoles: roles,
        loading,
        saving,
        deleting,
        handleSave,
        handleDelete
    } = useRoles()

    const {
        selectedId,
        isAddingNew,
        formData,
        setFormData,
        handleAddClick,
        handleRoleClick,
        handleCancel,
        clearSelection
    } = useRoleForm(roles)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState(null)

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Funções", link: "/admin/roles" },
        ]
        setBreadcrumbItems("Gestão de Funções", breadcrumbItems)
    }, [setBreadcrumbItems])

    const confirmDelete = async () => {
        if (roleToDelete) {
            const ok = await handleDelete(roleToDelete)
            if (ok) {
                setDeleteModalOpen(false)
                setRoleToDelete(null)
                if (selectedId === roleToDelete.id) {
                    clearSelection()
                }
            }
        }
    }

    // Render Sidebar Content (Lista)
    const SidebarContent = (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && roles.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : roles.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-account-tie d-block font-size-24 mb-2"></i>
                    Nenhuma função cadastrada.
                </div>
            ) : null}
            {roles.map(role => (
                <RoleListItem
                    key={role.id}
                    role={role}
                    active={selectedId === role.id}
                    onClick={() => handleRoleClick(role)}
                />
            ))}
        </div>
    )

    // Render Main Content (Formulário)
    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            <OverlayLoader show={saving} label="Salvando função..." />
            <OverlayLoader show={deleting} label="Excluindo função..." />

            {(selectedId || isAddingNew) && formData ? (
                <div>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            {formData.id ? 'Editar Função' : 'Nova Função'}
                        </h5>
                        <div className="d-flex gap-2">
                            {formData.id && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => {
                                        setRoleToDelete(formData)
                                        setDeleteModalOpen(true)
                                    }}
                                    disabled={saving || deleting}
                                    title="Excluir Função"
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
                                    await handleSave(formData)
                                }}
                            >
                                Salvar
                            </ButtonLoader>
                        </div>
                    </div>

                    <RoleForm
                        value={formData}
                        onChange={setFormData}
                    />
                </div>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-account-tie mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Funções</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione uma função na lista lateral para editar ou crie uma nova função.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Nova Função
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Funções da Unidade"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Nova Função"
                isLoading={loading && !isReady}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModalOpen}
                toggle={() => setDeleteModalOpen(false)}
                title="Excluir Função"
                description={
                    <span>
                        Tem certeza que deseja excluir <strong>{roleToDelete?.name}</strong>?
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

export default connect(null, { setBreadcrumbItems })(RolesPage)
