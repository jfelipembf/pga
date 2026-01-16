import React, { useEffect, useState } from "react"
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
import { GENDER_OPTIONS } from "../../constants/gender"
import { fetchAddressByCep, normalizeCep } from "../../helpers/cep"
import PhotoPreview from "./PhotoPreview"
import OverlayLoader from "./OverlayLoader"

const initialState = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  phone: "",
  email: "",
  zip: "",
  state: "",
  city: "",
  neighborhood: "",
  address: "",
  number: "",
  complement: "",
  avatarFile: null,
  roleId: "",
  roleTitle: "",
}

const BasicModalForm = ({
  isOpen,
  toggle,
  title = "Novo registro",
  onSubmit,
  renderExtra,
  submitting = false,
}) => {
  const [formData, setFormData] = useState(initialState)
  const [preview, setPreview] = useState(null)
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState)
      setPreview(null)
    }
  }, [isOpen])

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    updateField("avatarFile", file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const handleZipChange = e => {
    const zip = normalizeCep(e.target.value)
    updateField("zip", zip)
  }

  const handleZipBlur = async () => {
    const zip = normalizeCep(formData.zip)
    if (zip.length !== 8) return
    setIsFetchingCep(true)
    const address = await fetchAddressByCep(zip)
    setIsFetchingCep(false)
    if (!address) return

    setFormData(prev => ({
      ...prev,
      zip,
      state: address.state || prev.state,
      city: address.city || prev.city,
      neighborhood: address.neighborhood || prev.neighborhood,
      address: address.address || prev.address,
      complement: prev.complement || address.complement || "",
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="xl"
      modalClassName="basic-modal"
      contentClassName="basic-modal__content"
    >
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody style={{ maxHeight: "60vh", overflowY: "auto", position: "relative" }}>
          <OverlayLoader show={submitting} />
          <Row className="mb-4 align-items-start g-4">
            <Col lg="3" md="4" className="d-flex justify-content-lg-start justify-content-center">
              <PhotoPreview
                inputId="avatarUpload"
                preview={preview}
                onChange={handleImageChange}
                size={150}
              />
            </Col>
            <Col lg="9" md="8">
              <Row className="g-3">
                <Col md="6">
                  <FormGroup>
                    <Label>Nome</Label>
                    <Input
                      value={formData.firstName}
                      onChange={e => updateField("firstName", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Sobrenome</Label>
                    <Input
                      value={formData.lastName}
                      onChange={e => updateField("lastName", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Sexo</Label>
                    <Input
                      type="select"
                      value={formData.gender}
                      onChange={e => updateField("gender", e.target.value)}
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
                      value={formData.birthDate}
                      onChange={e => updateField("birthDate", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={e => updateField("phone", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => updateField("email", e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </Row>

          <h6 className="fw-semibold mb-3">Endereço</h6>
          <Row className="g-3">
            <Col md="4">
              <FormGroup>
                <Label className="d-flex align-items-center gap-2">
                  CEP
                  {isFetchingCep ? (
                    <span className="text-muted small">Buscando endereço...</span>
                  ) : null}
                </Label>
                <Input
                  value={formData.zip}
                  onChange={handleZipChange}
                  onBlur={handleZipBlur}
                  maxLength={9}
                  placeholder="00000000"
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={e => updateField("state", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={e => updateField("city", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={e => updateField("neighborhood", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={e => updateField("address", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Número</Label>
                <Input
                  value={formData.number}
                  onChange={e => updateField("number", e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="8">
              <FormGroup>
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={e => updateField("complement", e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>

          {renderExtra ? (
            <div className="mt-4">{renderExtra({ formData, updateField })}</div>
          ) : null}
        </ModalBody>
        <ModalFooter className="d-flex align-items-center gap-3">

          <Button color="light" onClick={toggle} disabled={submitting}>
            Cancelar
          </Button>
          <Button color="primary" type="submit" disabled={submitting}>
            Salvar
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default BasicModalForm
