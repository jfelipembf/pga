import React from "react"
import { Row, Col, FormGroup, Label, Input } from "reactstrap"

const ClientExtraFields = ({ updateField }) => (
    <>
        <h6 className="fw-semibold mb-3">Responsáveis</h6>
        <Row className="g-3 mb-4">
            <Col md="6">
                <FormGroup>
                    <Label>Nome do responsável</Label>
                    <Input onChange={e => updateField("guardianName", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="6">
                <FormGroup>
                    <Label>Telefone do responsável</Label>
                    <Input onChange={e => updateField("guardianPhone", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="12">
                <FormGroup>
                    <Label>Email do responsável</Label>
                    <Input type="email" onChange={e => updateField("guardianEmail", e.target.value)} />
                </FormGroup>
            </Col>
        </Row>

        <h6 className="fw-semibold mb-3">Informações de saúde</h6>
        <Row className="g-3">
            <Col md="6">
                <FormGroup>
                    <Label>Contato de emergência</Label>
                    <Input onChange={e => updateField("emergencyContact", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="6">
                <FormGroup>
                    <Label>Número do plano</Label>
                    <Input onChange={e => updateField("healthPlan", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="6">
                <FormGroup>
                    <Label>Restrições médicas</Label>
                    <Input onChange={e => updateField("medicalRestrictions", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="6">
                <FormGroup>
                    <Label>Alergias</Label>
                    <Input onChange={e => updateField("allergies", e.target.value)} />
                </FormGroup>
            </Col>
            <Col md="12">
                <FormGroup>
                    <Label>Observações adicionais</Label>
                    <Input
                        type="textarea"
                        rows="3"
                        onChange={e => updateField("healthNotes", e.target.value)}
                    />
                </FormGroup>
            </Col>
        </Row>
    </>
)

export default ClientExtraFields
