import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Badge, Card, CardBody, CardHeader, Button, Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap"

import SideMenu from "components/Common/SideMenu"
import { setBreadcrumbItems } from "../../../store/actions"
import PageLoader from "../../../components/Common/PageLoader"
import ButtonLoader from "../../../components/Common/ButtonLoader"

import { useEvaluationLevelsLogic } from "./Hooks/useEvaluationLevelsLogic"

const EvaluationLevelsPage = ({ setBreadcrumbItems }) => {
    const {
        levels,
        selectedId,
        selected,
        form,
        setForm,
        isLoading,
        handleSelect,
        handleNew,
        handleSave,
        handleDelete,
        onDragStart,
        onDragOver,
        onDragEnd,
        sideMenuItems
    } = useEvaluationLevelsLogic()

    useEffect(() => {
        const breadcrumbs = [
            { title: "Gerencial", link: "/management" },
            { title: "Níveis", link: "/management/evaluation-levels" },
        ]
        setBreadcrumbItems("Níveis de avaliação", breadcrumbs)
    }, [setBreadcrumbItems])

    if (isLoading('page') && !levels.length) {
        return <PageLoader />
    }

    return (
        <Container fluid className="event-planning">
            <Row className="g-4">
                <Col lg="4">
                    <SideMenu
                        title="Níveis"
                        description="Arraste para ordenar ou clique para editar."
                        items={sideMenuItems}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onDelete={handleDelete}
                        headerActions={
                            <Button color="primary" size="sm" onClick={handleNew} className="d-flex align-items-center gap-1">
                                <i className="mdi mdi-plus" /> Novo
                            </Button>
                        }
                        extraControls={
                            <div className="small text-muted d-flex align-items-center gap-2">
                                <i className="mdi mdi-hand-back-right" />
                                Arraste para mudar a ordem
                            </div>
                        }
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragEnd={onDragEnd}
                    />
                </Col>

                <Col lg="8">
                    <Card className="shadow-sm h-100">
                        <CardHeader className="bg-white d-flex align-items-center justify-content-between">
                            <div>
                                <h5 className="mb-0">{selected ? selected.title : "Novo Nível"}</h5>
                                {selected && (
                                    <p className="text-muted mb-0 small">Ordem {levels.findIndex(l => l.id === selectedId) + 1}</p>
                                )}
                            </div>
                            {selected && (
                                <Badge color="primary" pill>
                                    {selected.value}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardBody>
                            <Form onSubmit={handleSave}>
                                <Row className="g-3">
                                    <Col md="6">
                                        <FormGroup>
                                            <Label>Nome</Label>
                                            <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} required />
                                        </FormGroup>
                                    </Col>
                                    <Col md="6">
                                        <FormGroup>
                                            <Label>Valor</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.value}
                                                onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end mt-3">
                                    <ButtonLoader color="primary" type="submit" loading={isLoading('save')}>
                                        Salvar nível
                                    </ButtonLoader>
                                </div>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>


        </Container>
    )
}

export default connect(null, { setBreadcrumbItems })(EvaluationLevelsPage)
