import React, { useState } from "react"
import { Col, Form, FormGroup, Input, Label, Row, Card, CardBody, Collapse, Button } from "reactstrap"
import { PERMISSIONS_BY_CATEGORY, CATEGORIES, DEFAULT_ROLES } from "../Constants/permissions"

const baseValue = {
    name: "",
    description: "",
    permissions: {},
    isActive: true,
}

/**
 * Formulário para Funções/Cargos com sistema de permissões.
 * Refatorado para garantir interatividade total nos checkboxes.
 */
export const RoleForm = ({ value = {}, onChange, readOnly = false }) => {
    const [openCategories, setOpenCategories] = useState({})

    const update = (field, val) => onChange?.({ ...value, [field]: val })

    const applyTemplate = (templateId) => {
        const template = DEFAULT_ROLES.find(r => r.id === templateId)
        if (template) {
            onChange?.({
                ...value,
                name: template.label,
                description: template.description,
                permissions: { ...template.permissions }
            })
        }
    }

    const form = {
        ...baseValue,
        ...value,
        name: value.name || value.label || baseValue.name
    }
    const permissions = form.permissions || {}

    const toggleCategory = (category) => {
        setOpenCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const togglePermission = (permissionId) => {
        if (readOnly) return;
        const newPermissions = {
            ...permissions,
            [permissionId]: !permissions[permissionId]
        }
        update("permissions", newPermissions)
    }

    const toggleAllInCategory = (category) => {
        if (readOnly) return;
        const categoryPermissions = PERMISSIONS_BY_CATEGORY[category]
        const allChecked = categoryPermissions.every(p => permissions[p.id])

        const newPermissions = { ...permissions }
        categoryPermissions.forEach(p => {
            newPermissions[p.id] = !allChecked
        })
        update("permissions", newPermissions)
    }

    return (
        <Form>
            {!value.id && (
                <Row className="g-3 mb-4">
                    <Col xs="12">
                        <Label className="text-muted fw-bold font-size-12 text-uppercase">Modelo de Função (Opcional)</Label>
                        <div className="d-flex flex-wrap gap-2">
                            {DEFAULT_ROLES.map(template => (
                                <Button
                                    key={template.id}
                                    color="outline-primary"
                                    size="sm"
                                    onClick={() => applyTemplate(template.id)}
                                    disabled={readOnly}
                                    className="px-3"
                                >
                                    {template.label}
                                </Button>
                            ))}
                        </div>
                    </Col>
                </Row>
            )}

            <Row className="g-3">
                <Col md={12}>
                    <FormGroup>
                        <Label className="fw-bold">Nome da Função *</Label>
                        <Input
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="Ex: Instrutor, Recepcionista, Gerente"
                            disabled={readOnly}
                            required
                        />
                    </FormGroup>
                </Col>
                <Col md={12}>
                    <FormGroup>
                        <Label className="fw-bold">Descrição</Label>
                        <Input
                            type="textarea"
                            rows="2"
                            value={form.description}
                            onChange={e => update("description", e.target.value)}
                            placeholder="Breve descrição das responsabilidades..."
                            disabled={readOnly}
                        />
                    </FormGroup>
                </Col>
            </Row>

            <FormGroup check className="mt-2 mb-4 d-flex align-items-center">
                <input
                    id="roleActive"
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={form.isActive !== false}
                    onChange={e => update("isActive", e.target.checked)}
                    disabled={readOnly}
                    style={{ cursor: 'pointer', width: '1.2rem', height: '1.2rem' }}
                />
                <Label check for="roleActive" className="ms-2 mb-0" style={{ cursor: 'pointer' }}>
                    Esta função está ativa e pode ser atribuída a colaboradores.
                </Label>
            </FormGroup>

            <hr className="my-4" />

            <h6 className="mb-3 text-primary fw-bold">
                <i className="mdi mdi-shield-lock-outline me-2"></i>
                Permissões de Acesso
            </h6>

            {CATEGORIES.map(category => {
                const categoryPermissions = PERMISSIONS_BY_CATEGORY[category]
                const checkedCount = categoryPermissions.filter(p => permissions[p.id]).length
                const totalCount = categoryPermissions.length
                const allChecked = checkedCount === totalCount

                return (
                    <Card key={category} className="mb-3 border shadow-none">
                        <div
                            className="d-flex justify-content-between align-items-center p-3 bg-light rounded-top cursor-pointer"
                            onClick={() => toggleCategory(category)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <i className={`mdi mdi-chevron-${openCategories[category] ? 'down' : 'right'} font-size-18 text-primary shadow-none`}></i>
                                <span className="fw-bold text-uppercase font-size-12">{category}</span>
                                <span className="badge bg-soft-primary text-primary ms-2">
                                    {checkedCount} / {totalCount} selecionadas
                                </span>
                            </div>
                            <Button
                                type="button"
                                color="link"
                                size="sm"
                                className="p-0 text-decoration-none font-size-12 fw-bold"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleAllInCategory(category)
                                }}
                                disabled={readOnly}
                            >
                                {allChecked ? 'Desmarcar Tudo' : 'Marcar Tudo'}
                            </Button>
                        </div>

                        <Collapse isOpen={openCategories[category]}>
                            <CardBody className="p-3 border-top">
                                <Row className="g-3">
                                    {categoryPermissions.map(permission => (
                                        <Col md={6} key={permission.id}>
                                            <div
                                                className={`p-2 rounded border-2 d-flex align-items-start gap-2 transition-all ${permissions[permission.id] ? 'bg-soft-primary border-primary' : 'bg-transparent border-transparent'}`}
                                                onClick={() => togglePermission(permission.id)}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                <div className="form-check custom-checkbox mt-1">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={!!permissions[permission.id]}
                                                        onChange={() => { }} // Controlled by parent div
                                                        style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                                                    />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold font-size-13 mb-0 text-dark">{permission.label}</div>
                                                    <small className="text-muted d-block" style={{ lineHeight: '1.2' }}>
                                                        {permission.description}
                                                    </small>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </CardBody>
                        </Collapse>
                    </Card>
                )
            })}
        </Form>
    )
}
