import React from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"
import { connect } from "react-redux"

import SideMenu from "components/Common/SideMenu"
import { ActivityForm, ActivityObjectives } from "./Components"
import PageLoader from "components/Common/PageLoader"
import ButtonLoader from "components/Common/ButtonLoader"
import OverlayLoader from "components/Common/OverlayLoader"

import { setBreadcrumbItems } from "../../../store/actions"
import { useActivitiesPage } from "./Hooks"


import ConfirmDialog from "components/Common/ConfirmDialog" // NEW

const ActivitiesPage = ({ setBreadcrumbItems }) => {
    const {
        selectedId,
        // setSelectedId,
        handleSelect,
        formValue,
        setFormValue,
        setActivities,
        // photoFile,
        setPhotoFile,
        photoPreview,
        isLoading,
        uploadingPhoto,
        handleSave,
        sideItems,
        // DND & Actions
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleEdit,
        handleDeleteRequest,
        // Delete
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleConfirmDelete
    } = useActivitiesPage({ setBreadcrumbItems })

    if (isLoading('page') && !sideItems.length) { // Use sideItems to check if loaded (activities)
        return <PageLoader />
    }

    return (
        <Container fluid>
            <Row className="g-4">
                <Col lg="4">
                    <SideMenu
                        title="Atividades"
                        description="Arraste para ordenar ou edite."
                        items={sideItems}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onEdit={handleEdit} // NEW
                        onDelete={handleDeleteRequest} // NEW
                        hideArrow={true} // NEW
                        // DND Handlers
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        emptyLabel="Nenhuma atividade cadastrada."
                        headerActions={
                            <Button
                                color="primary"
                                size="sm"
                                onClick={() => {
                                    handleSelect("new")
                                }}
                            >
                                Nova atividade
                            </Button>
                        }
                    />
                </Col>

                <Col lg="8">
                    <Card className="shadow-sm mb-3 position-relative">
                        <OverlayLoader show={isLoading('selection')} />
                        <CardHeader className="bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h5 className="mb-0">{formValue.name || "Selecione uma atividade"}</h5>
                                <p className="text-muted mb-0 small">Edite ou crie uma atividade.</p>
                            </div>
                            {selectedId ? (
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="form-check form-switch p-0 m-0 d-flex align-items-center">
                                            <input
                                                className="form-check-input m-0 cursor-pointer shadow-none"
                                                type="checkbox"
                                                id="activeSwitch"
                                                checked={formValue.active !== false}
                                                onChange={e => {
                                                    const isActive = e.target.checked;
                                                    setFormValue(prev => ({
                                                        ...prev,
                                                        active: isActive,
                                                        status: isActive ? "ativo" : "pausado"
                                                    }))
                                                }}
                                                style={{ cursor: "pointer", scale: '1.2' }}
                                            />
                                        </div>
                                        <Badge
                                            color={formValue.active !== false ? "success" : "secondary"}
                                            pill
                                            className="px-3 py-1"
                                            style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                        >
                                            {formValue.active !== false ? "Ativa" : "Inativa"}
                                        </Badge>
                                    </div>

                                    <ButtonLoader
                                        color="primary"
                                        size="sm"
                                        onClick={handleSave}
                                        loading={isLoading('save') || uploadingPhoto}
                                        className="px-4"
                                    >
                                        Salvar
                                    </ButtonLoader>
                                </div>
                            ) : null}


                        </CardHeader>
                        <CardBody>
                            {selectedId ? (
                                <ActivityForm
                                    value={formValue}
                                    onChange={setFormValue}
                                    photoPreview={photoPreview || formValue.photoUrl}
                                    onPhotoChange={file => setPhotoFile(file)}
                                />
                            ) : (
                                <div className="text-muted">Selecione uma atividade para editar ou clique em “Nova atividade”.</div>
                            )}
                        </CardBody>
                    </Card>

                    {selectedId && formValue.id !== "new" && (
                        <ActivityObjectives
                            objectives={formValue.objectives || []}
                            onChange={nextObjectives => {
                                setFormValue(prev => ({ ...prev, objectives: nextObjectives }))
                                setActivities(prev =>
                                    prev.map(item => (item.id === selectedId ? { ...item, objectives: nextObjectives } : item))
                                )
                            }}
                        />
                    )}
                </Col>
            </Row>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Atividade"
                message="Tem certeza que deseja excluir esta atividade? Essa ação não pode ser desfeita."
                confirmColor="danger"
                confirmText="Sim, excluir"
            />
        </Container>
    )
}

export default connect(null, { setBreadcrumbItems })(ActivitiesPage)
