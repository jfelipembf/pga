import React from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

const baseValue = {
    title: "",
    value: 0,
    order: 0,
    isActive: true
}

/**
 * Formulário para Níveis de Avaliação
 */
export const EvaluationLevelForm = ({ value = {}, onChange, readOnly = false }) => {
    const update = (field, val) => onChange?.({ ...value, [field]: val })

    const form = { ...baseValue, ...value }

    return (
        <Form>
            <Row className="g-3">
                <Col xs="12" md="6">
                    <FormGroup>
                        <Label>Título *</Label>
                        <Input
                            value={form.title}
                            onChange={e => update("title", e.target.value)}
                            placeholder="Ex: Excelente, Bom, Regular, Insuficiente"
                            disabled={readOnly}
                            required
                        />
                    </FormGroup>
                </Col>

                <Col xs="12" md="3">
                    <FormGroup>
                        <Label>Valor *</Label>
                        <Input
                            type="number"
                            value={form.value}
                            onChange={e => update("value", parseFloat(e.target.value))}
                            placeholder="0-10"
                            min="0"
                            max="10"
                            step="0.1"
                            disabled={readOnly}
                            required
                        />
                        <small className="text-muted">Valor numérico (0-10)</small>
                    </FormGroup>
                </Col>

                <Col xs="12" md="3">
                    <FormGroup>
                        <Label>Ordem *</Label>
                        <Input
                            type="number"
                            value={form.order}
                            onChange={e => update("order", parseInt(e.target.value))}
                            placeholder="0"
                            min="0"
                            disabled={readOnly}
                            required
                        />
                        <small className="text-muted">Ordem de exibição</small>
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col xs="12">
                    <FormGroup check>
                        <Input
                            type="checkbox"
                            checked={form.active}
                            onChange={e => update("active", e.target.checked)}
                            disabled={readOnly}
                            id="active-checkbox"
                        />
                        <Label check for="active-checkbox">
                            Nível ativo
                        </Label>
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col xs="12">
                    <div className="alert alert-info mb-0">
                        <i className="mdi mdi-information-outline me-2"></i>
                        <strong>Dica:</strong> Os níveis são usados para avaliar o desempenho dos alunos. 
                        O valor numérico é usado para cálculos e a ordem define como aparecem nas listas.
                    </div>
                </Col>
            </Row>
        </Form>
    )
}
