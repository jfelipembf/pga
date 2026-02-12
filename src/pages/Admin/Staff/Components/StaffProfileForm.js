import React from 'react'
import { Row, Col, Form, FormGroup, Label, Input, Button, FormFeedback, Spinner } from 'reactstrap'
import InputMask from "react-input-mask"

// import { maskCPF, maskPhone, maskCEP } from '../../../../utils/maskUtils'

import ChangePasswordModal from './ChangePasswordModal'

const StaffProfileForm = ({ formik, roles = [], handlePasswordChange, isChangingPassword, handleCepBlur, isLoadingCep }) => {
    const [isPassModalOpen, setIsPassModalOpen] = React.useState(false)

    const onUpdatePassword = async (newPassword) => {
        const success = await handlePasswordChange(newPassword)
        if (success) {
            setIsPassModalOpen(false)
        }
    }

    return (
        <div className="profile-section animate__animated animate__fadeIn">
            <Form onSubmit={formik.handleSubmit}>
                {/* INFORMAÇÕES PESSOAIS */}
                <div className="mb-4">
                    <div className="profile-section__title d-flex align-items-center mb-3">
                        <div className="bg-soft-primary text-primary avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                            <i className="mdi mdi-account-details font-size-16" />
                        </div>
                        <h5 className="mb-0 font-size-15 fw-bold text-dark">Informações Pessoais</h5>
                    </div>

                    <Row className="g-3">
                        <Col md={4}>
                            <FormGroup>
                                <Label>Nome Completo <span className="text-danger">*</span></Label>
                                <Input
                                    name="name"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.name && !!formik.errors.name}
                                />
                                {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>E-mail (Login) <span className="text-danger">*</span></Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formik.values.email}
                                    disabled
                                    className="bg-light"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Telefone</Label>
                                <InputMask
                                    mask="(99) 99999-9999"
                                    name="phone"
                                    value={formik.values.phone}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="form-control"
                                    placeholder="(00) 00000-0000"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>CPF</Label>
                                <InputMask
                                    mask="999.999.999-99"
                                    name="cpf"
                                    value={formik.values.cpf}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="form-control"
                                    placeholder="000.000.000-00"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Data de Nascimento</Label>
                                <Input
                                    type="date"
                                    name="birthDate"
                                    value={formik.values.birthDate}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button
                                type="button"
                                color="warning"
                                outline
                                className="w-100 mb-3"
                                onClick={() => setIsPassModalOpen(true)}
                            >
                                <i className="mdi mdi-key-variant me-2" />
                                Alterar Senha de Acesso
                            </Button>
                        </Col>
                    </Row>
                </div>

                <hr className="my-4 opacity-50" />

                {/* DADOS PROFISSIONAIS */}
                <div className="mb-4">
                    <div className="profile-section__title d-flex align-items-center mb-3">
                        <div className="bg-soft-success text-success avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                            <i className="mdi mdi-briefcase-variant-outline font-size-16" />
                        </div>
                        <h5 className="mb-0 font-size-15 fw-bold text-dark">Dados Profissionais</h5>
                    </div>

                    <Row className="g-3">
                        <Col md={3}>
                            <FormGroup>
                                <Label>Cargo <span className="text-danger">*</span></Label>
                                <Input
                                    type="select"
                                    name="roleId"
                                    value={formik.values.roleId}
                                    onChange={formik.handleChange}
                                    invalid={formik.touched.roleId && !!formik.errors.roleId}
                                >
                                    <option value="">Selecione...</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name || role.label}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>ID Profissional (Conselho)</Label>
                                <Input
                                    name="professionalId"
                                    placeholder="Ex: CRM, CREF, etc"
                                    value={formik.values.professionalId}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Salário Atual (R$)</Label>
                                <Input
                                    type="number"
                                    name="salary"
                                    value={formik.values.salary}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Data de Contratação</Label>
                                <Input
                                    type="date"
                                    name="hireDate"
                                    value={formik.values.hireDate}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Status do Colaborador</Label>
                                <Input
                                    type="select"
                                    name="status"
                                    value={formik.values.status}
                                    onChange={formik.handleChange}
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="suspended">Suspenso</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                </div>

                <hr className="my-4 opacity-50" />

                {/* ENDEREÇO */}
                <div className="mb-4">
                    <div className="profile-section__title d-flex align-items-center mb-3">
                        <div className="bg-soft-info text-info avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                            <i className="mdi mdi-map-marker-outline font-size-16" />
                        </div>
                        <h5 className="mb-0 font-size-15 fw-bold text-dark">Endereço Residencial</h5>
                    </div>

                    <Row className="g-3">
                        <Col md={2}>
                            <FormGroup>
                                <Label className="d-flex align-items-center gap-2">
                                    CEP
                                    {isLoadingCep && <Spinner size="sm" color="primary" />}
                                </Label>
                                <InputMask
                                    mask="99999-999"
                                    name="zipCode"
                                    value={formik.values.zipCode}
                                    onChange={formik.handleChange}
                                    onBlur={handleCepBlur}
                                    className="form-control"
                                    placeholder="00000-000"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={5}>
                            <FormGroup>
                                <Label>Logradouro</Label>
                                <Input
                                    name="street"
                                    value={formik.values.street}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={1}>
                            <FormGroup>
                                <Label>Nº</Label>
                                <Input
                                    name="number"
                                    value={formik.values.number}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Complemento</Label>
                                <Input
                                    name="complement"
                                    value={formik.values.complement}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Bairro</Label>
                                <Input
                                    name="neighborhood"
                                    value={formik.values.neighborhood}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Cidade</Label>
                                <Input
                                    name="city"
                                    value={formik.values.city}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Estado (UF)</Label>
                                <Input
                                    name="state"
                                    value={formik.values.state}
                                    onChange={formik.handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-5 border-top pt-4">
                    <Button
                        type="button"
                        color="light"
                        className="px-4"
                        onClick={() => formik.resetForm()}
                    >
                        Descartar
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        className="px-4 shadow-sm"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? <Spinner size="sm" className="me-2" /> : <i className="mdi mdi-check-circle-outline me-2" />}
                        Salvar Alterações
                    </Button>
                </div>
            </Form>

            {/* Modal de Alteração de Senha */}
            <ChangePasswordModal
                isOpen={isPassModalOpen}
                toggle={() => setIsPassModalOpen(!isPassModalOpen)}
                onConfirm={onUpdatePassword}
                loading={isChangingPassword}
            />
        </div>
    )
}

export default StaffProfileForm
