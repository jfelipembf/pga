import React, { useState, useMemo } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Row, Nav, NavItem, NavLink } from "reactstrap"
import { connect } from "react-redux"
import classnames from "classnames"

import SideMenu from "components/Common/SideMenu"
import { ActivityForm, ActivityObjectives } from "./Components"
import PageLoader from "components/Common/PageLoader"
import ButtonLoader from "components/Common/ButtonLoader"
import OverlayLoader from "components/Common/OverlayLoader"

import { setBreadcrumbItems } from "../../../store/actions"
import { useActivitiesPage } from "./Hooks"
import { SWIMMING_ACTIVITIES_DEFAULT } from "../../../utils/swimmingActivities"

import ConfirmDialog from "components/Common/ConfirmDialog"

const ActivitiesPage = ({ setBreadcrumbItems }) => {
    const {
        selectedId: customSelectedId,
        handleSelect: handleCustomSelect,
        formValue: customFormValue,
        setFormValue: setCustomFormValue,
        setActivities,
        setPhotoFile,
        photoPreview,
        isLoading,
        uploadingPhoto,
        handleSave,
        sideItems,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleEdit,
        handleDeleteRequest,
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleConfirmDelete
    } = useActivitiesPage({ setBreadcrumbItems })

    // --- Standard Model Logic ---
    const [modelType, setModelType] = useState('custom') // 'custom' | 'standard'
    const [standardSelectedId, setStandardSelectedId] = useState(null)

    // Add IDs to constants for list handling
    const standardActivities = useMemo(() => {
        return SWIMMING_ACTIVITIES_DEFAULT.map((act, idx) => ({
            ...act,
            id: `std-${idx}`,
            title: act.name,
            subtitle: act.levels ? `${act.levels.length} níveis` : act.description,
            active: true
        }))
    }, [])

    const handleStandardSelect = (id) => {
        setStandardSelectedId(id)
    }

    // Determine current display values based on mode
    const isStandard = modelType === 'standard'

    const currentSelectedId = isStandard ? standardSelectedId : customSelectedId

    // For Standard, finding the object by ID. For Custom, use the hook's formValue (which acts as the buffer).
    // Note: When switching to Standard, we might just look up the object directly.
    const currentFormValue = isStandard
        ? (standardActivities.find(a => a.id === standardSelectedId) || {})
        : customFormValue

    // Wrapper handlers
    const onSelect = isStandard ? handleStandardSelect : handleCustomSelect

    if (isLoading('page') && !sideItems.length) {
        return <PageLoader />
    }

    return (
        <Container fluid>
            <Row className="g-4">
                <Col lg="4">
                    {/* Model Type Toggle */}
                    <Nav pills className="mb-3 nav-justified bg-light p-1 rounded">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: modelType === 'custom' })}
                                onClick={() => { setModelType('custom'); }}
                                style={{ cursor: 'pointer' }}
                            >
                                Personalizado
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: modelType === 'standard' })}
                                onClick={() => { setModelType('standard'); setStandardSelectedId(standardActivities[0]?.id); }}
                                style={{ cursor: 'pointer' }}
                            >
                                Modelo Padrão
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <SideMenu
                        title={isStandard ? "Metodologia Padrão" : "Minhas Atividades"}
                        description={isStandard ? "Habilidades e níveis pré-definidos." : "Arraste para ordenar ou edite."}
                        items={isStandard ? standardActivities : sideItems}
                        selectedId={currentSelectedId}
                        onSelect={onSelect}
                        onEdit={isStandard ? undefined : handleEdit}
                        onDelete={isStandard ? undefined : handleDeleteRequest}
                        hideArrow={true}
                        onDragStart={isStandard ? undefined : handleDragStart}
                        onDragOver={isStandard ? undefined : handleDragOver}
                        onDragEnd={isStandard ? undefined : handleDragEnd}
                        emptyLabel="Nenhuma atividade cadastrada."
                        headerActions={
                            !isStandard && (
                                <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => handleCustomSelect("new")}
                                >
                                    Nova atividade
                                </Button>
                            )
                        }
                    />
                </Col>

                <Col lg="8">
                    <Card className="shadow-sm mb-3 position-relative">
                        <OverlayLoader show={!isStandard && isLoading('selection')} />
                        <CardHeader className="bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h5 className="mb-0">{currentFormValue.name || "Selecione uma atividade"}</h5>
                                <p className="text-muted mb-0 small">
                                    {isStandard ? "Visualização do modelo padrão." : "Edite ou crie uma atividade."}
                                </p>
                            </div>

                            {/* Controls - Only for Custom Mode */}
                            {!isStandard && currentSelectedId ? (
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="form-check form-switch p-0 m-0 d-flex align-items-center">
                                            <input
                                                className="form-check-input m-0 cursor-pointer shadow-none"
                                                type="checkbox"
                                                id="activeSwitch"
                                                checked={currentFormValue.active !== false}
                                                onChange={e => {
                                                    const isActive = e.target.checked;
                                                    setCustomFormValue(prev => ({
                                                        ...prev,
                                                        active: isActive,
                                                        status: isActive ? "ativo" : "pausado"
                                                    }))
                                                }}
                                                style={{ cursor: "pointer", scale: '1.2' }}
                                            />
                                        </div>
                                        <Badge
                                            color={currentFormValue.active !== false ? "success" : "secondary"}
                                            pill
                                            className="px-3 py-1"
                                            style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                        >
                                            {currentFormValue.active !== false ? "Ativa" : "Inativa"}
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
                            {currentSelectedId ? (
                                <ActivityForm
                                    value={currentFormValue}
                                    onChange={isStandard ? undefined : setCustomFormValue}
                                    photoPreview={photoPreview || currentFormValue.photoUrl}
                                    onPhotoChange={isStandard ? undefined : file => setPhotoFile(file)}
                                    readOnly={isStandard}
                                />
                            ) : (
                                <div className="text-muted">Selecione uma atividade para visualizar.</div>
                            )}
                        </CardBody>
                    </Card>

                    {currentSelectedId && currentFormValue.id !== "new" && (
                        <ActivityObjectives
                            objectives={currentFormValue.objectives || []}
                            onChange={isStandard ? undefined : nextObjectives => {
                                setCustomFormValue(prev => ({ ...prev, objectives: nextObjectives }))
                                setActivities(prev =>
                                    prev.map(item => (item.id === customSelectedId ? { ...item, objectives: nextObjectives } : item))
                                )
                            }}
                            readOnly={isStandard}
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
