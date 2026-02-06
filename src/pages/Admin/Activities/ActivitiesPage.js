import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Spinner } from "reactstrap"
import { setBreadcrumbItems } from "../../../store/actions"
import { useActivities } from "./hooks/useActivities"
import { useActivityForm } from "./hooks/useActivityForm"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { ActivityForm, ActivityObjectives, ActivityListItem } from "./Components"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import { transformObjectivesToArray, hasObjectives } from "./utils/objectivesTransform"

const ActivitiesPage = ({ setBreadcrumbItems }) => {
    document.title = "Gestão de Atividades | PGA Admin"

    const {
        filteredActivities: activities,
        loading,
        saving,
        deleting,
        handleSave,
        handleDelete
    } = useActivities()

    const {
        selectedId,
        isAddingNew,
        formData,
        photoFile,
        photoPreview,
        setFormData,
        handleAddClick,
        handleActivityClick,
        handleCancel,
        handlePhotoChange,
        clearSelection
    } = useActivityForm()

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [activityToDelete, setActivityToDelete] = useState(null)

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Atividades", link: "/admin/activities" },
        ]
        setBreadcrumbItems("Gestão de Atividades", breadcrumbItems)
    }, [setBreadcrumbItems])

    const confirmDelete = async () => {
        if (activityToDelete) {
            const ok = await handleDelete(activityToDelete)
            if (ok) {
                setDeleteModalOpen(false)
                setActivityToDelete(null)
                if (selectedId === activityToDelete.id) {
                    clearSelection()
                }
            }
        }
    }

    // Render Sidebar Content (Lista)
    const SidebarContent = (
        <div>
            {loading && activities.length === 0 ? (
                <div className="text-center p-4">
                    <Spinner size="sm" color="primary" />
                    <p className="mt-2 mb-0 text-muted small">Carregando atividades...</p>
                </div>
            ) : activities.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-run d-block font-size-24 mb-2"></i>
                    Nenhuma atividade cadastrada.
                </div>
            ) : null}
            {activities.map(activity => (
                <ActivityListItem
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedId === activity.id}
                    onClick={() => handleActivityClick(activity)}
                />
            ))}
        </div>
    )

    // Render Main Content (Formulário)
    const MainContent = (selectedId || isAddingNew) && formData ? (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{formData.id ? 'Editar Atividade' : 'Nova Atividade'}</h5>
                <div className="d-flex gap-2">
                    {formData.id && (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                                setActivityToDelete(formData)
                                setDeleteModalOpen(true)
                            }}
                            disabled={saving || deleting}
                            title="Excluir Atividade"
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
                            // Salvar dados básicos da atividade (sem objectives)
                            const { objectives, ...activityData } = formData
                            const dataToSave = { ...activityData, photoFile }
                            await handleSave(dataToSave, objectives)
                            // Não fecha o formulário após salvar - permite continuar editando
                        }}
                    >
                        Salvar
                    </ButtonLoader>
                </div>
            </div>

            <ActivityForm
                value={formData}
                onChange={setFormData}
                photoPreview={photoPreview}
                onPhotoChange={handlePhotoChange}
            />

            {formData.id && (
                <div className="mt-4">
                    {!hasObjectives(formData.objectives) ? (
                        <div className="alert alert-info">
                            <i className="mdi mdi-information-outline me-2"></i>
                            Esta atividade ainda não possui objetivos cadastrados.
                            {formData.name && ` Use o sistema antigo para adicionar objetivos à atividade "${formData.name}".`}
                        </div>
                    ) : (
                        <ActivityObjectives
                            objectives={transformObjectivesToArray(formData.objectives)}
                            onChange={(updatedObjectives) => {
                                setFormData({ ...formData, objectives: updatedObjectives })
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-run mb-3" style={{ fontSize: '5rem', opacity: 0.2 }}></i>
            <h5 className="fw-bold">Gestão de Atividades</h5>
            <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                Selecione uma atividade na lista lateral para editar ou crie uma nova atividade.
            </p>
            <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                Nova Atividade
            </button>
        </div>
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Minhas Atividades"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Nova Atividade"
                isLoading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModalOpen}
                toggle={() => setDeleteModalOpen(false)}
                title="Excluir Atividade"
                description={
                    <span>
                        Tem certeza que deseja excluir <strong>{activityToDelete?.name}</strong>?
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

export default connect(null, { setBreadcrumbItems })(ActivitiesPage)
