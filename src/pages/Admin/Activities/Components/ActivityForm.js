import React, { useEffect, useState } from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

import PhotoPreview from "../../../../components/Common/PhotoPreview"

const baseValue = {
  name: "",
  description: "",
  color: "#3c5068",
  status: "active",
  isActive: true,
}


/**
 * Formulário enxuto e responsivo para Atividades.
 * - Recebe o value e onChange do pai para todos os campos de dados.
 * - Mantém apenas preview/file locais para a foto.
 * - Upload deve ser feito no salvar (fora do componente).
 */
const ActivityForm = ({ value = {}, onChange, photoPreview = "", onPhotoChange, readOnly = false }) => {
  const [localPreview, setLocalPreview] = useState(photoPreview || value.photo || "")

  useEffect(() => {
    setLocalPreview(photoPreview || value.photo || "")
  }, [photoPreview, value.photo])

  const update = (field, val) => onChange?.({ ...value, [field]: val })

  const handlePhotoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setLocalPreview(reader.result)
    reader.readAsDataURL(file)
    onPhotoChange?.(file, e)
  }

  const form = { ...baseValue, ...value }

  return (
    <Form>
      <Row className="g-3">
        <Col xs="12" sm="auto" className="d-flex align-items-start">
          <PhotoPreview
            inputId="activityPhoto"
            preview={localPreview}
            placeholder="Foto da Atividade"
            onChange={handlePhotoChange}
            size={120}
            rounded
            readOnly={readOnly}
          />
        </Col>
        
        <Col xs="12" sm className="flex-grow-1">
          <Row className="g-3">
            <Col md="6" sm="12">
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  disabled={readOnly}
                />
              </FormGroup>
            </Col>
            <Col md="3" sm="6" xs="12">
              <FormGroup>
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={e => update("color", e.target.value)}
                  style={{ height: 48, width: 72, padding: 0 }}
                  disabled={readOnly}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col xs="12">
              <FormGroup>
                <Label>Descrição</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={form.description}
                  onChange={e => update("description", e.target.value)}
                  disabled={readOnly}
                />
              </FormGroup>
            </Col>
          </Row>
        </Col>
      </Row>
    </Form>
  )
}

export default React.memo(ActivityForm)
