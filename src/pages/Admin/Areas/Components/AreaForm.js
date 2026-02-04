import React, { useEffect, useState } from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"
import PhotoPreview from "../../../../components/Common/PhotoPreview"

const baseValue = {
    name: "",
    description: "",
    color: "",
    width: "",
    length: "",
    capacity: "",
    isActive: true,
}

/**
 * Formulário enxuto e responsivo para Áreas.
 * Segue o mesmo padrão de ActivityForm.
 */
export const AreaForm = ({ value = {}, onChange, photoPreview = "", onPhotoChange, readOnly = false }) => {
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
                        inputId="areaPhoto"
                        preview={localPreview}
                        placeholder=""
                        onChange={handlePhotoChange}
                        size={120}
                        rounded
                        readOnly={readOnly}
                    />
                </Col>
                
                <Col xs="12" sm className="flex-grow-1">
                    <Row className="g-3">
                        <Col md="12">
                            <FormGroup>
                                <Label>Nome da Área</Label>
                                <Input
                                    value={form.name}
                                    onChange={e => update("name", e.target.value)}
                                    placeholder="Ex: Piscina Principal"
                                    disabled={readOnly}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row className="g-3 mt-2">
                        <Col md="4">
                            <FormGroup>
                                <Label>Largura (m)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.width}
                                    onChange={e => update("width", e.target.value)}
                                    placeholder="25"
                                    disabled={readOnly}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label>Comprimento (m)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.length}
                                    onChange={e => update("length", e.target.value)}
                                    placeholder="50"
                                    disabled={readOnly}
                                />
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label>Capacidade</Label>
                                <Input
                                    type="number"
                                    value={form.capacity}
                                    onChange={e => update("capacity", e.target.value)}
                                    placeholder="30"
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
                                    placeholder="Descrição da área..."
                                    disabled={readOnly}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col xs="12">
                            <FormGroup check>
                                <Input
                                    id="areaActive"
                                    type="checkbox"
                                    checked={form.isActive !== false}
                                    onChange={e => update("isActive", e.target.checked)}
                                    disabled={readOnly}
                                />
                                <Label check for="areaActive">
                                    Área Ativa
                                </Label>
                            </FormGroup>
                            <small className="text-muted">
                                Áreas inativas não aparecem para agendamento
                            </small>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Form>
    )
}
