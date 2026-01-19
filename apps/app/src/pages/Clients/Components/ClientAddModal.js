import React, { useEffect, useState } from "react"
import {
    Button,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row,
} from "reactstrap"
import { GENDER_OPTIONS } from "../../../constants/gender"
import { fetchAddressByCep, normalizeCep } from "../../../helpers/cep"
import { formatTitleCase } from "../../../helpers/string"
import PhotoPreview from "../../../components/Common/PhotoPreview"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import logoIcon from "../../../assets/images/logoIcon.png"

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
}

const ClientAddModal = ({
    isOpen,
    toggle,
    onSubmit,
    renderExtra,
    submitting = false,
}) => {
    const [formData, setFormData] = useState(initialState)
    const [preview, setPreview] = useState(null)
    const [isFetchingCep, setIsFetchingCep] = useState(false)

    const updateField = (field, value) => {
        let finalValue = value
        const fieldsToFormat = [
            "firstName", "lastName",
            "city", "neighborhood", "address", "state", "complement"
        ]

        if (fieldsToFormat.includes(field) && typeof value === "string") {
            finalValue = formatTitleCase(value)
        }

        setFormData(prev => ({
            ...prev,
            [field]: finalValue,
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
            contentClassName="border-0 shadow-lg rounded"
        >
            <ModalHeader
                toggle={toggle}
                className="bg-primary border-bottom-0 rounded-top"
                close={
                    <button
                        className="btn-close btn-close-white"
                        onClick={toggle}
                        style={{ fontSize: '16px', opacity: 1 }}
                        aria-label="Close"
                    />
                }
            >
                <div className="d-flex align-items-center">
                    <img
                        src={logoIcon}
                        alt="Logo"
                        style={{
                            height: '80px',
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)'
                        }}
                        className="me-3"
                    />
                    <div className="border-start border-white border-opacity-25 ps-3">
                        <h4 className="text-white fw-bold mb-0" style={{ fontSize: '1.1rem' }}>Novo Aluno</h4>
                        <p className="text-white-50 mb-0 font-size-12">Preencha os dados abaixo.</p>
                    </div>
                </div>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
                <ModalBody style={{ maxHeight: "70vh", overflowY: "auto", position: "relative" }} className="p-4">
                    <OverlayLoader show={submitting} />

                    <Row className="mb-4 g-4">
                        {/* Left Column: Photo */}
                        <Col lg="3" className="d-flex flex-column align-items-center border-end">
                            <PhotoPreview
                                inputId="avatarUpload"
                                preview={preview}
                                onChange={handleImageChange}
                                size={160}
                            />
                            <span className="text-muted small mt-2">Clique para alterar a foto</span>
                        </Col>

                        {/* Right Column: Personal Data */}
                        <Col lg="9">
                            <h5 className="font-size-15 fw-bold mb-3 text-primary"><i className="mdi mdi-account-details me-2"></i>Dados Pessoais</h5>
                            <Row className="g-3">
                                <Col md="6">
                                    <FormGroup>
                                        <Label className="lb-sm">Nome</Label>
                                        <Input
                                            bsSize="sm"
                                            value={formData.firstName}
                                            onChange={e => updateField("firstName", e.target.value)}
                                            required
                                            placeholder="Primeiro nome"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md="6">
                                    <FormGroup>
                                        <Label className="lb-sm">Sobrenome</Label>
                                        <Input
                                            bsSize="sm"
                                            value={formData.lastName}
                                            onChange={e => updateField("lastName", e.target.value)}
                                            required
                                            placeholder="Sobrenome completo"
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="6">
                                    <FormGroup>
                                        <Label className="lb-sm">Email</Label>
                                        <Input
                                            bsSize="sm"
                                            type="email"
                                            value={formData.email}
                                            onChange={e => updateField("email", e.target.value)}
                                            placeholder="exemplo@email.com"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md="3">
                                    <FormGroup>
                                        <Label className="lb-sm">Telefone</Label>
                                        <Input
                                            bsSize="sm"
                                            value={formData.phone}
                                            onChange={e => updateField("phone", e.target.value)}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md="3">
                                    <FormGroup>
                                        <Label className="lb-sm">Nascimento</Label>
                                        <Input
                                            bsSize="sm"
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={e => updateField("birthDate", e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md="3">
                                    <FormGroup>
                                        <Label className="lb-sm">Sexo</Label>
                                        <Input
                                            bsSize="sm"
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
                            </Row>
                        </Col>
                    </Row>

                    <hr className="my-4" />

                    <h5 className="font-size-15 fw-bold mb-3 text-primary"><i className="mdi mdi-map-marker-radius me-2"></i>Endereço</h5>
                    <Row className="g-3">
                        <Col md="3">
                            <FormGroup>
                                <Label className="d-flex align-items-center gap-2 lb-sm">
                                    CEP
                                    {isFetchingCep && <i className="bx bx-loader bx-spin font-size-12" />}
                                </Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.zip}
                                    onChange={handleZipChange}
                                    onBlur={handleZipBlur}
                                    maxLength={9}
                                    placeholder="00000-000"
                                />
                            </FormGroup>
                        </Col>
                        <Col md="6">
                            <FormGroup>
                                <Label className="lb-sm">Endereço (Rua/Av)</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.address}
                                    onChange={e => updateField("address", e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="3">
                            <FormGroup>
                                <Label className="lb-sm">Número</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.number}
                                    onChange={e => updateField("number", e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label className="lb-sm">Bairro</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.neighborhood}
                                    onChange={e => updateField("neighborhood", e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label className="lb-sm">Cidade</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.city}
                                    onChange={e => updateField("city", e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label className="lb-sm">Estado</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.state}
                                    onChange={e => updateField("state", e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="12">
                            <FormGroup>
                                <Label className="lb-sm">Complemento</Label>
                                <Input
                                    bsSize="sm"
                                    value={formData.complement}
                                    onChange={e => updateField("complement", e.target.value)}
                                    placeholder="Apto, Bloco, Referência..."
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    {renderExtra && (
                        <>
                            <hr className="my-4" />
                            <h5 className="font-size-15 fw-bold mb-3 text-primary"><i className="mdi mdi-notebook-edit-outline me-2"></i>Outras Informações</h5>
                            {renderExtra({ formData, updateField })}
                        </>
                    )}

                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="secondary" outline onClick={toggle} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button color="primary" type="submit" disabled={submitting} className="px-4">
                        <i className="bx bx-save me-1"></i> Salvar Aluno
                    </Button>
                </ModalFooter>
            </Form>
        </Modal >
    )
}

export default ClientAddModal
