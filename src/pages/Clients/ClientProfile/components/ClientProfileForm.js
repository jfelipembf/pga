import React, { useState } from 'react'
import { Row, Col, Form, FormGroup, Label, Input, Button, FormFeedback, Spinner } from 'reactstrap'
import InputMask from "react-input-mask"
import { GENDER_OPTIONS } from "../../../../utils/constants"
import { getAddressByCep } from "../../../../services/External/AddressService"

const ClientProfileForm = ({ formik }) => {
    const [isLoadingCep, setIsLoadingCep] = useState(false)

    const handleCepBlur = async (e) => {
        const cep = e.target.value?.replace(/\D/g, '')
        if (!cep || cep.length !== 8) return

        setIsLoadingCep(true)
        const address = await getAddressByCep(cep)
        setIsLoadingCep(false)

        if (address) {
            formik.setFieldValue("street", address.logradouro)
            formik.setFieldValue("neighborhood", address.bairro)
            formik.setFieldValue("city", address.localidade)
            formik.setFieldValue("state", address.uf)
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
                                <Label>Nome <span className="text-danger">*</span></Label>
                                <Input
                                    name="firstName"
                                    value={formik.values.firstName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.firstName && !!formik.errors.firstName}
                                />
                                {formik.touched.firstName && formik.errors.firstName && <FormFeedback>{formik.errors.firstName}</FormFeedback>}
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Sobrenome <span className="text-danger">*</span></Label>
                                <Input
                                    name="lastName"
                                    value={formik.values.lastName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.lastName && !!formik.errors.lastName}
                                />
                                {formik.touched.lastName && formik.errors.lastName && <FormFeedback>{formik.errors.lastName}</FormFeedback>}
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Data de Nascimento <span className="text-danger">*</span></Label>
                                <Input
                                    type="date"
                                    name="birthDate"
                                    value={formik.values.birthDate}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.birthDate && !!formik.errors.birthDate}
                                />
                                {formik.touched.birthDate && formik.errors.birthDate && <FormFeedback>{formik.errors.birthDate}</FormFeedback>}
                            </FormGroup>
                        </Col>

                        <Col md={3}>
                            <FormGroup>
                                <Label>Sexo</Label>
                                <Input
                                    type="select"
                                    name="gender"
                                    value={formik.values.gender}
                                    onChange={formik.handleChange}
                                >
                                    {GENDER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>CPF</Label>
                                <InputMask
                                    mask="999.999.999-99"
                                    name="cpf"
                                    value={formik.values.cpf}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                >
                                    {(inputProps) => (
                                        <Input
                                            {...inputProps}
                                            invalid={formik.touched.cpf && !!formik.errors.cpf}
                                        />
                                    )}
                                </InputMask>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>E-mail <span className="text-danger">*</span></Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.email && !!formik.errors.email}
                                />
                                {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Telefone <span className="text-danger">*</span></Label>
                                <InputMask
                                    mask="(99) 99999-9999"
                                    name="phone"
                                    value={formik.values.phone}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                >
                                    {(inputProps) => (
                                        <Input
                                            {...inputProps}
                                            invalid={formik.touched.phone && !!formik.errors.phone}
                                        />
                                    )}
                                </InputMask>
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
                        <h5 className="mb-0 font-size-15 fw-bold text-dark">Endereço</h5>
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
                                >
                                    {(inputProps) => <Input {...inputProps} />}
                                </InputMask>
                            </FormGroup>
                        </Col>
                        <Col md={5}>
                            <FormGroup>
                                <Label>Rua</Label>
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

                <hr className="my-4 opacity-50" />

                {/* EMERGÊNCIA E SAÚDE */}
                <Row className="g-4">
                    <Col md={6}>
                        <div className="profile-section__title d-flex align-items-center mb-3">
                            <div className="bg-soft-danger text-danger avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="mdi mdi-alert-circle-outline font-size-16" />
                            </div>
                            <h5 className="mb-0 font-size-15 fw-bold text-dark">Emergência</h5>
                        </div>
                        <Row className="g-3">
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Nome do Contato</Label>
                                    <Input
                                        name="emergencyName"
                                        value={formik.values.emergencyName}
                                        onChange={formik.handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Telefone de Emergência</Label>
                                    <InputMask
                                        mask="(99) 99999-9999"
                                        name="emergencyPhone"
                                        value={formik.values.emergencyPhone}
                                        onChange={formik.handleChange}
                                    >
                                        {(inputProps) => <Input {...inputProps} />}
                                    </InputMask>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={6}>
                        <div className="profile-section__title d-flex align-items-center mb-3">
                            <div className="bg-soft-warning text-warning avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="mdi mdi-medical-bag font-size-16" />
                            </div>
                            <h5 className="mb-0 font-size-15 fw-bold text-dark">Saúde</h5>
                        </div>
                        <FormGroup>
                            <Label>Observações Médicas</Label>
                            <Input
                                type="textarea"
                                rows="4"
                                name="healthObservations"
                                placeholder="Alergias, restrições, medicamentos..."
                                value={formik.values.healthObservations}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-5 border-top pt-4">
                    <Button
                        type="button"
                        color="light"
                        className="btn-rounded px-4"
                        onClick={() => formik.resetForm()}
                    >
                        Descartar Alterações
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        className="btn-rounded px-4 shadow-sm"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? <Spinner size="sm" className="me-2" /> : <i className="mdi mdi-check-circle-outline me-2" />}
                        {formik.isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default ClientProfileForm
