import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Spinner } from "reactstrap"
import { setBreadcrumbItems } from "../../../store/actions"
import { useEvaluationLevels } from "./hooks/useEvaluationLevels"
import { useEvaluationLevelForm } from "./hooks/useEvaluationLevelForm"
import { EvaluationLevelListItem } from "./Components/EvaluationLevelListItem"
import { EvaluationLevelForm } from "./Components/EvaluationLevelForm"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

const EvaluationLevelsPage = ({ setBreadcrumbItems }) => {
    document.title = "Níveis de Avaliação | Lexa Admin"

    const {
        levels,
        loading,
        saving,
        deleting,
        handleSave,
        handleDelete
    } = useEvaluationLevels()

    const {
        selectedId,
        setSelectedId,
        isAddingNew,
        formData,
        setFormData,
        handleAddClick,
        handleLevelClick,
        handleCancel,
        clearSelection
    } = useEvaluationLevelForm()

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [levelToDelete, setLevelToDelete] = useState(null)

    useEffect(() => {
        setBreadcrumbItems("Níveis de Avaliação", [
            { title: "Gestão", link: "/admin" },
            { title: "Níveis de Avaliação", link: "/admin/evaluation-levels" },
        ])
    }, [setBreadcrumbItems])

    const confirmDelete = async () => {
        if (levelToDelete) {
            const ok = await handleDelete(levelToDelete)
            if (ok) {
                setDeleteModalOpen(false)
                setLevelToDelete(null)
                if (selectedId === levelToDelete.id) {
                    clearSelection()
                }
            }
        }
    }

    // Render Sidebar Content (Lista)
    const SidebarContent = (
        <div>
            {loading && levels.length === 0 ? (
                <div className="text-center p-4">
                    <Spinner size="sm" color="primary" />
                    <p className="mt-2 mb-0 text-muted small">Carregando níveis...</p>
                </div>
            ) : levels.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    <i className="mdi mdi-chart-line d-block font-size-24 mb-2"></i>
                    Nenhum nível cadastrado.
                </div>
            ) : null}
            {levels.map(level => (
                <EvaluationLevelListItem
                    key={level.id}
                    level={level}
                    active={selectedId === level.id}
                    onClick={() => handleLevelClick(level)}
                />
            ))}
        </div>
    )

    // Render Main Content (Formulário)
    const MainContent = (selectedId || isAddingNew) && formData ? (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    {formData.id ? 'Editar Nível de Avaliação' : 'Novo Nível de Avaliação'}
                </h5>
                <div className="d-flex gap-2">
                    {formData.id && (
                        <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => {
                                setLevelToDelete(formData)
                                setDeleteModalOpen(true)
                            }}
                            disabled={saving || deleting}
                            title="Excluir Nível"
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

            <EvaluationLevelForm
                value={formData}
                onChange={setFormData}
            />
        </div>
    ) : (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '400px' }}>
            <i className="mdi mdi-chart-line mb-3" style={{ fontSize: '5rem', opacity: 0.2 }}></i>
            <h5 className="fw-bold">Gestão de Níveis de Avaliação</h5>
            <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                Selecione um nível na lista lateral para editar ou crie um novo nível.
            </p>
            <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                <i className="mdi mdi-plus me-1"></i>
                Novo Nível
            </button>
        </div>
    )

    return (
        <>
            <ManagementLayout
                title="Níveis de Avaliação"
                addButtonText="Novo Nível"
                onAddClick={handleAddClick}
                loading={loading}
                sidebarContent={SidebarContent}
                mainContent={MainContent}
            />

            <ConfirmDialog
                isOpen={deleteModalOpen}
                toggle={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Nível de Avaliação"
                description={`Tem certeza que deseja excluir o nível "${levelToDelete?.title}"?`}
                confirmText="Excluir"
                confirmColor="danger"
                loading={deleting}
            />
        </>
    )
}

const mapDispatchToProps = dispatch => ({
    setBreadcrumbItems: (title, items) => dispatch(setBreadcrumbItems(title, items))
})

export default connect(null, mapDispatchToProps)(EvaluationLevelsPage)
