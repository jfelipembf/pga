import React, { useEffect, useState } from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

import PhotoPreview from "components/Common/PhotoPreview"
import { PLACEHOLDER_CAMERA } from "../../../Clients/Constants/defaults"

const baseValue = {
  name: "",
  description: "",
  color: "#3c5068",
  status: "ativo",
  active: true,
}


/**
 * Formulário enxuto e responsivo para Atividades.
 * - Recebe o value e onChange do pai para todos os campos de dados.
 * - Mantém apenas preview/file locais para a foto.
 * - Upload deve ser feito no salvar (fora do componente).
 */
const ActivityForm = ({ value = {}, onChange, photoPreview = "", onPhotoChange }) => {
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
      <Row className="g-3 align-items-start">
        <Col xs="12" sm="4" md="3" lg="2" className="d-flex justify-content-start">
          <PhotoPreview
            inputId="activityPhoto"
            preview={localPreview}
            placeholder={PLACEHOLDER_CAMERA}
            onChange={handlePhotoChange}
            size={120}
          />
        </Col>
        <Col xs="12" sm="8" md="9" lg="10" className="ps-lg-4">
          <Row className="g-3 mt-1">
            <Col md="6" sm="12">
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  style={{ maxWidth: 400 }}
                />
              </FormGroup>
            </Col>
            <Col md="3" sm="6" xs="12">
              <FormGroup className="d-flex flex-column">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={e => update("color", e.target.value)}
                  style={{ height: 48, width: 72, padding: 0, rounded: 8, maxWidth: 100 }}
                />
              </FormGroup>
            </Col>
          </Row>


          <FormGroup>
            <Label>Descrição</Label>
            <Input
              type="textarea"
              rows="3"
              value={form.description}
              onChange={e => update("description", e.target.value)}
              style={{ maxWidth: 500 }}
            />
          </FormGroup>
        </Col>
      </Row>
    </Form>
  )
}

export default ActivityForm
