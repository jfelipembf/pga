
import React, { useState, useEffect } from "react"
import PropTypes from "prop-types"
import {
    Button,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Row,
    Spinner,
} from "reactstrap"
import PhotoPreview from "../../../components/Common/PhotoPreview"
import { useTenant } from "../../../hooks/useTenant"
import { StorageService } from "../../../services/Core/StorageService"
import { FormSwitch } from "../../../components/Common/FormSwitch"

const defaultState = {
    name: "",
    description: "",
    width: "",
    length: "",
    capacity: "",
    status: "active",
    isActive: true,
    photo: "",
    preview: "",
}

export const AreaFormVisual = ({ initialData, onSave, onCancel, onDelete }) => {
    const { idTenant, idBranch } = useTenant()
    const [formData, setFormData] = useState(defaultState)
    const [photoFile, setPhotoFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultState,
                ...initialData,
                preview: initialData.photo || ""
            })
        } else {
            setFormData(defaultState)
        }
        setPhotoFile(null)
    }, [initialData])

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
        setPhotoFile(file)
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setSubmitting(true)

        try {
            let photoUrl = formData.photo
            if (photoFile) {
                setUploading(true)
                photoUrl = await StorageService.uploadProfileImage(photoFile, {
                    idTenant,
                    idBranch,
                    entityType: 'areas',
                    entityId: initialData?.id || 'new',
                    currentPhotoUrl: initialData?.photo
                })
                setUploading(false)
            }

            await onSave({
                ...formData,
                photo: photoUrl,
                width: Number(formData.width) || 0,
                length: Number(formData.length) || 0,
                capacity: Number(formData.capacity) || 0,
            })
        } catch (error) {
            console.error("Erro ao salvar área:", error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-3 bg-white rounded shadow-sm border">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h4 className="mb-0 text-dark">
                    {initialData ? `Editar: ${initialData.name}` : "Nova Área"}
                </h4>
                <div className="d-flex gap-2">
                    {initialData && (
                        <Button color="danger" outline onClick={() => onDelete(initialData)} title="Excluir Área">
                            <i className="mdi mdi-trash-can-outline"></i>
                        </Button>
                    )}
                    <Button color="secondary" outline onClick={onCancel} disabled={submitting}>Cancelar</Button>
                    <Button color="primary" onClick={handleSubmit} disabled={submitting || uploading}>
                        {submitting || uploading ? <Spinner size="sm" /> : "Salvar Área"}
                    </Button>
                </div>
            </div>

            <Form onSubmit={handleSubmit}>
                <div className="mb-5">
                    <h6 className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '12px' }}>Dados da Área</h6>
                    <Row>
                        <Col md={3} className="text-center mb-3">
                            <PhotoPreview
                                inputId="areaPhoto"
                                preview={formData.preview}
                                placeholder="Foto"
                                onChange={handlePhotoChange}
                                size={140}
                                className="shadow-sm border mx-auto mb-2"
                            />
                            <small className="text-muted d-block">Clique para alterar</small>
                        </Col>

                        <Col md={9}>
                            <Row className="g-3">
                                <Col md="12">
                                    <FormGroup>
                                        <Label className="fw-bold">Nome da área</Label>
                                        <Input
                                            placeholder="Ex: Sala de Musculação, Estúdio de Pilates..."
                                            value={formData.name}
                                            onChange={e => updateField("name", e.target.value)}
                                            required
                                            className="form-control-lg"
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="12">
                                    <FormGroup>
                                        <Label className="fw-bold">Descrição</Label>
                                        <Input
                                            type="textarea"
                                            placeholder="Informações adicionais sobre o espaço..."
                                            value={formData.description}
                                            onChange={e => updateField("description", e.target.value)}
                                            rows={3}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="4">
                                    <FormGroup>
                                        <Label className="fw-bold">Largura (m)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.width}
                                            onChange={e => updateField("width", e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="4">
                                    <FormGroup>
                                        <Label className="fw-bold">Comprimento (m)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.length}
                                            onChange={e => updateField("length", e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="4">
                                    <FormGroup>
                                        <Label className="fw-bold">Capacidade</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Max pessoas"
                                            value={formData.capacity}
                                            onChange={e => updateField("capacity", e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md="6">
                                    <FormGroup className="mb-0">
                                        <Label className="fw-bold">Status Operacional</Label>
                                        <div className="mt-1">
                                            <FormSwitch
                                                id="areaActive"
                                                checked={!!formData.isActive}
                                                onChange={(val) => updateField("isActive", val)}
                                                label={formData.isActive ? "Ativa (Visível)" : "Inativa (Oculta)"}
                                            />
                                        </div>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>
            </Form>
        </div>
    )
}

AreaFormVisual.propTypes = {
    initialData: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func
}
