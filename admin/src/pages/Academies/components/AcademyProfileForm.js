import React, { useState } from "react"
import { Card, CardBody, CardHeader, Col, Form, FormGroup, Input, Label, Row, Button, Badge, InputGroup } from "reactstrap"
import PropTypes from "prop-types"
import { slugify } from "../../../helpers/url_sanitizer"

const AcademyProfileForm = ({
    value,
    onChange,
    disabled = false,
    onSave,
    onCancel,
    onEdit,
    isCreatingNew = false,
    isEditing = false,
    submitting = false,
    users = []
}) => {
    const formData = value || {}
    const selectedOwnerIds = formData.owners || []

    // Ensure form is NOT disabled if we are editing or creating
    const isFormDisabled = disabled && !isEditing && !isCreatingNew

    const [copied, setCopied] = useState(false)

    const tenantSlug = formData.companyInfo?.slug || ""
    const branchSlug = formData.slug || ""
    const fullPath = tenantSlug && branchSlug ? `${tenantSlug}/${branchSlug}` : (branchSlug || tenantSlug)
    const baseUrl = "https://app.painelswim.com"
    const fullUrl = `${baseUrl}/${fullPath}`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const updateField = (field, nextValue) => {
        onChange?.({ ...formData, [field]: nextValue });
    }

    const toggleOwner = (uid) => {
        const nextOwners = selectedOwnerIds.includes(uid)
            ? selectedOwnerIds.filter(id => id !== uid)
            : [...selectedOwnerIds, uid]
        updateField("owners", nextOwners)
    }

    const updateAddressField = (type, field, nextValue) => {
        const addressKey = type === 'owner' ? 'ownerAddress' : 'address';
        onChange?.({
            ...formData,
            [addressKey]: {
                ...(formData[addressKey] || {}),
                [field]: nextValue
            }
        });
    }

    const updateOwnerField = (field, nextValue) => {
        onChange?.({
            ...formData,
            owner: {
                ...(formData.owner || {}),
                [field]: nextValue
            }
        });
    }



    return (
        <Card className="shadow-sm">
            <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2 bg-white">
                <div>
                    <h5 className="mb-0 text-primary">{isCreatingNew ? "Cadastrar Nova Unidade" : "Perfil da Academia"}</h5>
                    <p className="text-muted mb-0 small">
                        {isCreatingNew ? "Preencha os dados da nova filial." : "Dados cadastrais da empresa e do responsável."}
                    </p>
                </div>
                {(isCreatingNew || isEditing) ? (
                    <div className="d-flex gap-2">
                        <Button
                            color="light"
                            className="px-4"
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="success"
                            className="px-4"
                            onClick={onSave}
                            disabled={submitting}
                        >
                            {submitting ? <i className="bx bx-loader bx-spin font-size-16 align-middle me-2"></i> : <i className="mdi mdi-content-save me-2"></i>}
                            {isEditing ? "Salvar Alterações" : "Salvar Unidade"}
                        </Button>
                    </div>
                ) : (
                    <Button
                        color="primary"
                        outline
                        className="px-4"
                        onClick={onEdit}
                    >
                        <i className="mdi mdi-pencil me-2"></i>
                        Editar Unidade
                    </Button>
                )}
            </CardHeader>
            <CardBody>
                <Form>
                    <h6 className="fw-semibold mb-3">Informações da Unidade</h6>
                    <Row className="g-3">
                        <Col xs="12" md="6">
                            <FormGroup>
                                <Label>Nome da Unidade / Filial</Label>
                                <Input
                                    value={formData.tradeName || ""}
                                    onChange={e => updateField("tradeName", e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="Ex: Unidade Centro"
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="6">
                            <FormGroup>
                                <Label>Slug (URL da Filial)</Label>
                                <Input
                                    value={formData.slug || ""}
                                    onChange={e => updateField("slug", slugify(e.target.value))}
                                    disabled={isFormDisabled}
                                    placeholder="a2/unidade-1"
                                />
                            </FormGroup>
                        </Col>
                        {!isCreatingNew && (
                            <Col md="12">
                                <FormGroup>
                                    <Label>Link da Unidade (Para encaminhar ao usuário)</Label>
                                    <InputGroup>
                                        <Input
                                            value={fullUrl}
                                            readOnly
                                            className="bg-light"
                                        />
                                        <Button
                                            color={copied ? "success" : "primary"}
                                            onClick={copyToClipboard}
                                            type="button"
                                            className="px-4"
                                        >
                                            {copied ? (
                                                <><i className="mdi mdi-check me-1" /> Copiado!</>
                                            ) : (
                                                <><i className="mdi mdi-content-copy me-1" /> Copiar</>
                                            )}
                                        </Button>
                                    </InputGroup>
                                    <p className="small text-muted mt-1">
                                        Este é o link direto que você deve enviar para os usuários acessarem esta unidade específica.
                                    </p>
                                </FormGroup>
                            </Col>
                        )}
                        <Col xs="12" md="6">
                            <FormGroup>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={e => updateField("email", e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="unidade@email.com"
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="6">
                            <FormGroup>
                                <Label>Telefone</Label>
                                <Input
                                    value={formData.phone || ""}
                                    onChange={e => updateField("phone", e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder="(00) 00000-0000"
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <hr className="my-4" />
                    <h6 className="fw-semibold mb-3">Endereço da Unidade</h6>
                    <Row className="g-3">
                        <Col xs="12" md="4" lg="3">
                            <FormGroup>
                                <Label>CEP</Label>
                                <Input
                                    value={formData.address?.zip || ""}
                                    onChange={e => updateAddressField("company", "zip", e.target.value)}
                                    disabled={isFormDisabled}
                                    maxLength={9}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="4" lg="3">
                            <FormGroup>
                                <Label>Estado</Label>
                                <Input
                                    value={formData.address?.state || ""}
                                    onChange={e => updateAddressField("company", "state", e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="4" lg="6">
                            <FormGroup>
                                <Label>Cidade</Label>
                                <Input
                                    value={formData.address?.city || ""}
                                    onChange={e => updateAddressField("company", "city", e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="6" lg="5">
                            <FormGroup>
                                <Label>Bairro</Label>
                                <Input
                                    value={formData.address?.neighborhood || ""}
                                    onChange={e => updateAddressField("company", "neighborhood", e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="6" lg="5">
                            <FormGroup>
                                <Label>Rua</Label>
                                <Input
                                    value={formData.address?.street || ""}
                                    onChange={e => updateAddressField("company", "street", e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs="12" md="2">
                            <FormGroup>
                                <Label>Número</Label>
                                <Input
                                    value={formData.address?.number || ""}
                                    onChange={e => updateAddressField("company", "number", e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <hr className="my-4" />
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-semibold mb-0">Responsáveis pela Unidade</h6>
                        {(isCreatingNew || isEditing) && <Badge color="soft-success" pill>Pool de Usuários</Badge>}
                    </div>

                    {(isCreatingNew || isEditing) && (
                        <div className="mb-4">
                            <Label className="text-muted small">Selecione responsáveis existentes (da unidade):</Label>
                            <Row className="g-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users.length > 0 ? users.map(user => (
                                    <Col md="4" key={user.uid || user.id}>
                                        <div
                                            className={`p-2 border rounded d-flex align-items-center gap-2 cursor-pointer ${selectedOwnerIds.includes(user.uid || user.id) ? 'border-primary bg-light' : 'bg-white opacity-75'}`}
                                            onClick={() => !isFormDisabled && toggleOwner(user.uid || user.id)}
                                            style={{ cursor: isFormDisabled ? 'default' : 'pointer' }}
                                        >
                                            <Input
                                                type="checkbox"
                                                checked={selectedOwnerIds.includes(user.uid || user.id)}
                                                onChange={() => { }}
                                                disabled={isFormDisabled}
                                                className="mt-0"
                                            />
                                            <div className="overflow-hidden">
                                                <div className="fw-bold text-truncate small">{user.firstName} {user.lastName || ""}</div>
                                                <div className="text-muted smaller text-truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </Col>
                                )) : <div className="p-2 text-muted small">Nenhum staff encontrado para selecionar.</div>}
                            </Row>
                        </div>
                    )}

                    <Row className="g-3">
                        <Col md="12">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <Label className="fw-semibold mb-0">Novos Responsáveis / Donos</Label>
                                {(isCreatingNew || isEditing) && (
                                    <Button
                                        type="button"
                                        color="primary"
                                        size="sm"
                                        outline
                                        onClick={() => {
                                            const currentNewOwners = formData.newOwners || [];
                                            updateField("newOwners", [...currentNewOwners, { firstName: "", lastName: "", email: "", phone: "" }]);
                                        }}
                                    >
                                        <i className="mdi mdi-plus-circle me-1" />
                                        Adicionar Novo
                                    </Button>
                                )}
                            </div>

                            {/* Legacy Primary Owner Section (Always show if it has data or is creating new) */}
                            {(isCreatingNew || formData.owner?.email) && (
                                <div className="p-3 border rounded-3 bg-light bg-opacity-10 mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small fw-bold text-primary">Responsável Principal</span>
                                    </div>
                                    <Row className="g-3">
                                        <Col md="6">
                                            <FormGroup className="mb-2">
                                                <Label className="small mb-1">Nome</Label>
                                                <Input
                                                    size="sm"
                                                    value={formData.owner?.firstName || ""}
                                                    onChange={e => updateOwnerField("firstName", e.target.value)}
                                                    disabled={isFormDisabled}
                                                    placeholder="Nome"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup className="mb-2">
                                                <Label className="small mb-1">Email</Label>
                                                <Input
                                                    size="sm"
                                                    type="email"
                                                    value={formData.owner?.email || ""}
                                                    onChange={e => updateOwnerField("email", e.target.value)}
                                                    disabled={isFormDisabled}
                                                    placeholder="email@exemplo.com"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* Dynamic list of additional new owners */}
                            {(formData.newOwners || []).map((newOwner, index) => (
                                <div key={index} className="p-3 border rounded-3 bg-light bg-opacity-10 mb-3 position-relative">
                                    <Button
                                        type="button"
                                        close
                                        className="position-absolute top-0 end-0 m-2"
                                        style={{ fontSize: '10px' }}
                                        onClick={() => {
                                            const nextNewOwners = [...formData.newOwners];
                                            nextNewOwners.splice(index, 1);
                                            updateField("newOwners", nextNewOwners);
                                        }}
                                        disabled={isFormDisabled}
                                    />
                                    <span className="small fw-bold text-muted mb-2 d-block">Outro Responsável #{index + 1}</span>
                                    <Row className="g-3">
                                        <Col md="6">
                                            <FormGroup className="mb-0">
                                                <Input
                                                    size="sm"
                                                    value={newOwner.firstName || ""}
                                                    onChange={e => {
                                                        const nextNewOwners = [...formData.newOwners];
                                                        nextNewOwners[index].firstName = e.target.value;
                                                        updateField("newOwners", nextNewOwners);
                                                    }}
                                                    disabled={isFormDisabled}
                                                    placeholder="Nome"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup className="mb-0">
                                                <Input
                                                    size="sm"
                                                    type="email"
                                                    value={newOwner.email || ""}
                                                    onChange={e => {
                                                        const nextNewOwners = [...formData.newOwners];
                                                        nextNewOwners[index].email = e.target.value;
                                                        updateField("newOwners", nextNewOwners);
                                                    }}
                                                    disabled={isFormDisabled}
                                                    placeholder="Email"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Form>
            </CardBody>
        </Card>
    )
}

AcademyProfileForm.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    isCreatingNew: PropTypes.bool,
    submitting: PropTypes.bool,
    users: PropTypes.array
}

export default AcademyProfileForm
