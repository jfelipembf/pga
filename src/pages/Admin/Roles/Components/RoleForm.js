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

    // Suporta tanto 'name' quanto 'label' (Firebase usa 'label')
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
        const newPermissions = {
            ...permissions,
            [permissionId]: !permissions[permissionId]
        }
        update("permissions", newPermissions)
    }

    const toggleAllInCategory = (category) => {
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
            {/* Template Selector - apenas ao criar novo */}
            {!value.id && (
                <Row className="g-3 mb-3">
                    <Col xs="12">
                        <Label>Modelo de Função (Opcional)</Label>
                        <div className="d-flex flex-wrap gap-2">
                            {DEFAULT_ROLES.map(template => (
                                <Button
                                    key={template.id}
                                    color="outline-primary"
                                    size="sm"
                                    onClick={() => applyTemplate(template.id)}
                                    disabled={readOnly}
                                >
                                    {template.label}
                                </Button>
                            ))}
                        </div>
                        <small className="text-muted">
                            Clique em um modelo para pré-configurar as permissões
                        </small>
                    </Col>
                </Row>
            )}

            <Row className="g-3">
                <Col xs="12">
                    <FormGroup>
                        <Label>Nome da Função *</Label>
                        <Input
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="Ex: Instrutor, Recepcionista, Gerente"
                            disabled={readOnly}
                            required
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
                            rows="2"
                            value={form.description}
                            onChange={e => update("description", e.target.value)}
                            placeholder="Descrição da função..."
                            disabled={readOnly}
                        />
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col xs="12">
                    <FormGroup check className="mb-3">
                        <Input
                            id="roleActive"
                            type="checkbox"
                            checked={form.isActive !== false}
                            onChange={e => update("isActive", e.target.checked)}
                            disabled={readOnly}
                        />
                        <Label check for="roleActive">
                            Função Ativa
                        </Label>
                    </FormGroup>
                </Col>
            </Row>

            {/* Permissões */}
            <Row className="mt-4">
                <Col xs="12">
                    <h6 className="mb-3">Permissões</h6>
                    {CATEGORIES.map(category => {
                        const categoryPermissions = PERMISSIONS_BY_CATEGORY[category]
                        const checkedCount = categoryPermissions.filter(p => permissions[p.id]).length
                        const totalCount = categoryPermissions.length
                        const allChecked = checkedCount === totalCount

                        return (
                            <Card key={category} className="mb-2">
                                <CardBody className="p-2">
                                    <div 
                                        className="d-flex justify-content-between align-items-center cursor-pointer"
                                        onClick={() => toggleCategory(category)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <i className={`mdi mdi-chevron-${openCategories[category] ? 'down' : 'right'}`}></i>
                                            <strong>{category}</strong>
                                            <span className="badge bg-secondary font-size-10">
                                                {checkedCount}/{totalCount}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleAllInCategory(category)
                                            }}
                                            disabled={readOnly}
                                        >
                                            {allChecked ? 'Desmarcar' : 'Marcar'} Todos
                                        </button>
                                    </div>

                                    <Collapse isOpen={openCategories[category]}>
                                        <div className="mt-3">
                                            {categoryPermissions.map(permission => (
                                                <FormGroup check key={permission.id} className="mb-2">
                                                    <Input
                                                        id={permission.id}
                                                        type="checkbox"
                                                        checked={!!permissions[permission.id]}
                                                        onChange={() => togglePermission(permission.id)}
                                                        disabled={readOnly}
                                                    />
                                                    <Label check for={permission.id}>
                                                        <strong>{permission.label}</strong>
                                                        <br />
                                                        <small className="text-muted">{permission.description}</small>
                                                    </Label>
                                                </FormGroup>
                                            ))}
                                        </div>
                                    </Collapse>
                                </CardBody>
                            </Card>
                        )
                    })}
                </Col>
            </Row>
        </Form>
    )
}
