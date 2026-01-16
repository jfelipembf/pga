import React from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

import PhotoPreview from "components/Common/PhotoPreview"

const SettingsGeneral = ({ value, logoPreview, onLogoChange, onChange }) => {
  const update = (field, v) => onChange?.(field, v)

  return (
    <Form>
      <Row className="g-2 align-items-start">
        <Col xs={12} md={3} lg={2} className="d-flex justify-content-start mb-3 mb-md-0">
          <PhotoPreview
            inputId="academyLogo"
            preview={logoPreview || value.logo}
            placeholder="Logo"
            onChange={onLogoChange}
            size={120}
          />
        </Col>
        <Col xs={12} md={9} lg={10}>
          <Row className="g-3">
            <Col xs={12} md={6} lg={5}>
              <FormGroup>
                <Label>Nome</Label>
                <Input value={value.name} onChange={e => update("name", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <FormGroup>
                <Label>CNPJ</Label>
                <Input value={value.cnpj} onChange={e => update("cnpj", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={12} lg={3}>
              <FormGroup>
                <Label>CEP</Label>
                <Input value={value.zip} onChange={e => update("zip", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Endereço</Label>
                <Input value={value.address} onChange={e => update("address", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Número</Label>
                <Input value={value.number} onChange={e => update("number", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Bairro</Label>
                <Input value={value.neighborhood} onChange={e => update("neighborhood", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Cidade</Label>
                <Input value={value.city} onChange={e => update("city", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Estado</Label>
                <Input value={value.state} onChange={e => update("state", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Metragem (m²)</Label>
                <Input value={value.areaSize} onChange={e => update("areaSize", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Logo (URL)</Label>
                <Input value={value.logo} onChange={e => update("logo", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Data de abertura</Label>
                <Input type="date" value={value.openingDate} onChange={e => update("openingDate", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Responsáveis</Label>
                <Input value={value.responsibles} onChange={e => update("responsibles", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Horários e dias de funcionamento</Label>
                <Input value={value.workingHours} onChange={e => update("workingHours", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Email</Label>
                <Input value={value.email} onChange={e => update("email", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={6}>
              <FormGroup>
                <Label>Site</Label>
                <Input value={value.website} onChange={e => update("website", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Instagram</Label>
                <Input value={value.instagram} onChange={e => update("instagram", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>Facebook</Label>
                <Input value={value.facebook} onChange={e => update("facebook", e.target.value)} />
              </FormGroup>
            </Col>
            <Col xs={12} md={4}>
              <FormGroup>
                <Label>WhatsApp</Label>
                <Input value={value.whatsapp} onChange={e => update("whatsapp", e.target.value)} />
              </FormGroup>
            </Col>
          </Row>
        </Col>
      </Row>
    </Form>
  )
}

export default SettingsGeneral
