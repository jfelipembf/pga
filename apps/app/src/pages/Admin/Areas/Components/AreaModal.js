import React, { useState } from "react"
import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap"

import PhotoPreview from "components/Common/PhotoPreview"

const defaultState = {
  name: "",
  width: "",
  length: "",
  capacity: "",
  photo: null,
  preview: null,
}

const AreaModal = ({ isOpen, toggle, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || defaultState)

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      updateField("preview", reader.result)
    }
    reader.readAsDataURL(file)
    updateField("photo", file)
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit?.({
      ...formData,
      width: Number(formData.width) || 0,
      length: Number(formData.length) || 0,
      capacity: Number(formData.capacity) || 0,
    })
    toggle?.()
    setFormData(defaultState)
  }

  const handleClose = () => {
    setFormData(defaultState)
    toggle?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={handleClose}
      centered
      size="lg"
      modalClassName="basic-modal"
      contentClassName="basic-modal__content"
    >
      <ModalHeader toggle={handleClose}>Nova área</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody className="basic-modal__body">
          <Row className="g-3 align-items-start">
            <Col md="3" className="d-flex justify-content-start">
              <PhotoPreview
                inputId="areaPhoto"
                preview={formData.preview}
                placeholder="Foto"
                onChange={handlePhotoChange}
                size={160}
              />
            </Col>
            <Col md="9">
              <Row className="g-2">
                <Col md="12">
                  <FormGroup>
                    <Label>Nome da área</Label>
                    <Input
                      value={formData.name}
                      onChange={e => updateField("name", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Largura (m)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.width}
                      onChange={e => updateField("width", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Comprimento (m)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.length}
                      onChange={e => updateField("length", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Capacidade máxima</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.capacity}
                      onChange={e => updateField("capacity", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={handleClose}>
            Cancelar
          </Button>
          <Button color="primary" type="submit">
            Salvar
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default AreaModal
