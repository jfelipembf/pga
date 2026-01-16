import React from "react"
import { Card, CardBody, CardHeader, Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

import { formatTitleCase } from "../../../helpers/string"
import { GENDER_OPTIONS } from "../../../constants/gender"

const ClientProfileForm = ({ value, onChange, disabled = false }) => {
  const formData = value || {}

  const updateField = (field, nextValue) => {
    let finalValue = nextValue;

    // Campos que devem ser padronizados (Title Case)
    const fieldsToFormat = [
      "firstName", "lastName", "guardianName",
      "city", "neighborhood", "address", "street", "complement", "state"
    ];

    if (fieldsToFormat.includes(field) && typeof nextValue === "string") {
      finalValue = formatTitleCase(nextValue);
    }

    onChange?.(prev => {
      const base = typeof prev === "object" && prev !== null ? prev : formData
      return { ...base, [field]: finalValue }
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Perfil do cliente</h5>
          <p className="text-muted mb-0 small">Dados cadastrais utilizados no formulário de novos clientes.</p>
        </div>
      </CardHeader>
      <CardBody>
        <Form>
          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  value={formData.firstName || ""}
                  onChange={e => updateField("firstName", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Sobrenome</Label>
                <Input
                  value={formData.lastName || ""}
                  onChange={e => updateField("lastName", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Sexo</Label>
                <Input
                  type="select"
                  value={formData.gender || ""}
                  onChange={e => updateField("gender", e.target.value)}
                  disabled={disabled}
                >
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  value={formData.birthDate || ""}
                  onChange={e => updateField("birthDate", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={e => updateField("phone", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={e => updateField("email", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
          </Row>

          <hr className="my-4" />
          <hr className="my-4" />
          <h6 className="fw-semibold mb-3">Endereço</h6>
          <Row className="g-3">
            <Col md="4">
              <FormGroup>
                <Label>CEP</Label>
                <Input
                  value={formData.address?.zip || formData.zip || ""}
                  onChange={e => updateField("zip", e.target.value)}
                  maxLength={9}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Estado</Label>
                <Input
                  value={formData.address?.state || formData.state || ""}
                  onChange={e => updateField("state", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Cidade</Label>
                <Input
                  value={formData.address?.city || formData.city || ""}
                  onChange={e => updateField("city", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Bairro</Label>
                <Input
                  value={formData.address?.neighborhood || formData.neighborhood || ""}
                  onChange={e => updateField("neighborhood", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Endereço</Label>
                <Input
                  value={formData.address?.street || formData.address?.address || (typeof formData.address === 'string' ? formData.address : "") || ""}
                  onChange={e => updateField("address", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Número</Label>
                <Input
                  value={formData.address?.number || formData.number || ""}
                  onChange={e => updateField("number", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
            <Col md="8">
              <FormGroup>
                <Label>Complemento</Label>
                <Input
                  value={formData.address?.complement || formData.complement || ""}
                  onChange={e => updateField("complement", e.target.value)}
                  disabled={disabled}
                />
              </FormGroup>
            </Col>
          </Row>

          <hr className="my-4" />
          <h6 className="fw-semibold mb-3">Responsáveis</h6>
          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label>Nome do responsável</Label>
                <Input
                  value={formData.guardianName || ""}
                  onChange={e => updateField("guardianName", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Telefone do responsável</Label>
                <Input
                  value={formData.guardianPhone || ""}
                  onChange={e => updateField("guardianPhone", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="12">
              <FormGroup>
                <Label>Email do responsável</Label>
                <Input
                  type="email"
                  value={formData.guardianEmail || ""}
                  onChange={e => updateField("guardianEmail", e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>

          <hr className="my-4" />
          <h6 className="fw-semibold mb-3">Informações de saúde</h6>
          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label>Contato de emergência</Label>
                <Input
                  value={formData.emergencyContact || ""}
                  onChange={e => updateField("emergencyContact", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Número do plano</Label>
                <Input value={formData.healthPlan || ""} onChange={e => updateField("healthPlan", e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Restrições médicas</Label>
                <Input
                  value={formData.medicalRestrictions || ""}
                  onChange={e => updateField("medicalRestrictions", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Alergias</Label>
                <Input value={formData.allergies || ""} onChange={e => updateField("allergies", e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="12">
              <FormGroup>
                <Label>Observações adicionais</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={formData.healthNotes || ""}
                  onChange={e => updateField("healthNotes", e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ClientProfileForm
