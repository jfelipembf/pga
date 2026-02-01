import React from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, FormFeedback, Spinner } from "reactstrap"
import InputMask from "react-input-mask"

// Components & Utils
import PhotoPreview from "../../../components/Common/PhotoPreview"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import { GENDER_OPTIONS } from "../../../utils/constants"
import { useClientForm } from "../hooks/useClientForm"

const ClientAddModal = ({ isOpen, toggle, onClientAdded }) => {
    const {
        formik,
        photoPreview,
        handlePhotoChange,
        isLoadingCep,
        handleCepBlur
    } = useClientForm({ onClientAdded, toggle })

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered scrollable>
            <ModalHeader toggle={toggle}>Novo Cliente</ModalHeader>
            <ModalBody className="position-relative">
                <OverlayLoader show={formik.isSubmitting} label="Salvando cliente..." />
                <form onSubmit={formik.handleSubmit}>
                    <Row>
                        <Col lg={12} className="text-center mb-4">
                            <PhotoPreview
                                inputId="client-photo"
                                preview={photoPreview}
                                onChange={handlePhotoChange}
                                size={120}
                                rounded
                            />
                        </Col>
                    </Row>

                    {/* DADOS PESSOAIS */}
                    <div className="bg-light p-3 rounded mb-4">
                        <h5 className="font-size-14 text-uppercase mb-3 fw-bold text-primary">
                            <i className="mdi mdi-account-circle me-1"></i> Dados Pessoais
                        </h5>
                        <Row>
                            <Col md={6}>
                                <div className="mb-3">
                                    <Label htmlFor="firstName">Nome <span className="text-danger">*</span></Label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        className={`form-control ${formik.touched.firstName && formik.errors.firstName ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.firstName}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && <FormFeedback>{formik.errors.firstName}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <Label htmlFor="lastName">Sobrenome <span className="text-danger">*</span></Label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        className={`form-control ${formik.touched.lastName && formik.errors.lastName ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.lastName}
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && <FormFeedback>{formik.errors.lastName}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="birthDate">Data de Nascimento <span className="text-danger">*</span></Label>
                                    <input
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        className={`form-control ${formik.touched.birthDate && formik.errors.birthDate ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.birthDate}
                                    />
                                    {formik.touched.birthDate && formik.errors.birthDate && <FormFeedback>{formik.errors.birthDate}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="gender">Sexo</Label> {/* Opcional */}
                                    <select
                                        id="gender"
                                        name="gender"
                                        className={`form-select ${formik.touched.gender && formik.errors.gender ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.gender}
                                    >
                                        {GENDER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {formik.touched.gender && formik.errors.gender && <FormFeedback>{formik.errors.gender}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="cpf">CPF</Label> {/* Opcional */}
                                    <InputMask
                                        mask="999.999.999-99"
                                        id="cpf"
                                        name="cpf"
                                        className={`form-control ${formik.touched.cpf && formik.errors.cpf ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.cpf}
                                    />
                                    {formik.touched.cpf && formik.errors.cpf && <FormFeedback>{formik.errors.cpf}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <div className="mb-3">
                                    <Label htmlFor="email">Email <span className="text-danger">*</span></Label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.email}
                                    />
                                    {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <Label htmlFor="phone">Telefone <span className="text-danger">*</span></Label>
                                    <InputMask
                                        mask="(99) 99999-9999"
                                        id="phone"
                                        name="phone"
                                        className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.phone}
                                    />
                                    {formik.touched.phone && formik.errors.phone && <FormFeedback>{formik.errors.phone}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* ENDEREÇO (Opcional) */}
                    <div className="bg-light p-3 rounded mb-4">
                        <h5 className="font-size-14 text-uppercase mb-3 fw-bold text-primary">
                            <i className="mdi mdi-map-marker me-1"></i> Endereço
                        </h5>
                        <Row>
                            <Col md={3}>
                                <div className="mb-3">
                                    <Label htmlFor="zipCode">CEP</Label>
                                    <div className="input-group">
                                        <InputMask
                                            mask="99999-999"
                                            id="zipCode"
                                            name="zipCode"
                                            className={`form-control ${formik.touched.zipCode && formik.errors.zipCode ? 'is-invalid' : ''}`}
                                            onChange={formik.handleChange}
                                            onBlur={(e) => {
                                                formik.handleBlur(e)
                                                handleCepBlur(e)
                                            }}
                                            value={formik.values.zipCode}
                                        />
                                        {isLoadingCep && <span className="input-group-text"><Spinner size="sm" /></span>}
                                    </div>
                                    {formik.touched.zipCode && formik.errors.zipCode && <div className="text-danger font-size-12 mt-1">{formik.errors.zipCode}</div>}
                                </div>
                            </Col>
                            <Col md={7}>
                                <div className="mb-3">
                                    <Label htmlFor="street">Rua</Label>
                                    <input
                                        id="street"
                                        name="street"
                                        type="text"
                                        className={`form-control ${formik.touched.street && formik.errors.street ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.street}
                                    />
                                    {formik.touched.street && formik.errors.street && <FormFeedback>{formik.errors.street}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={2}>
                                <div className="mb-3">
                                    <Label htmlFor="number">Número</Label>
                                    <input
                                        id="number"
                                        name="number"
                                        type="text"
                                        className={`form-control ${formik.touched.number && formik.errors.number ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.number}
                                    />
                                    {formik.touched.number && formik.errors.number && <FormFeedback>{formik.errors.number}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="complement">Complemento</Label>
                                    <input
                                        id="complement"
                                        name="complement"
                                        type="text"
                                        className="form-control"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.complement}
                                    />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="neighborhood">Bairro</Label>
                                    <input
                                        id="neighborhood"
                                        name="neighborhood"
                                        type="text"
                                        className={`form-control ${formik.touched.neighborhood && formik.errors.neighborhood ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.neighborhood}
                                    />
                                    {formik.touched.neighborhood && formik.errors.neighborhood && <FormFeedback>{formik.errors.neighborhood}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="mb-3">
                                    <Label htmlFor="city">Cidade</Label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        className={`form-control ${formik.touched.city && formik.errors.city ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.city}
                                    />
                                    {formik.touched.city && formik.errors.city && <FormFeedback>{formik.errors.city}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={1}>
                                <div className="mb-3">
                                    <Label htmlFor="state">UF</Label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        maxLength={2}
                                        className={`form-control ${formik.touched.state && formik.errors.state ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.state}
                                    />
                                    {formik.touched.state && formik.errors.state && <FormFeedback>{formik.errors.state}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* CONTATO DE EMERGÊNCIA (Opcional) */}
                    <div className="bg-light p-3 rounded mb-4">
                        <h5 className="font-size-14 text-uppercase mb-3 fw-bold text-primary">
                            <i className="mdi mdi-alert-circle-outline me-1"></i> Contato de Emergência
                        </h5>
                        <Row>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="emergencyName">Nome</Label>
                                    <input
                                        id="emergencyName"
                                        name="emergencyName"
                                        type="text"
                                        className={`form-control ${formik.touched.emergencyName && formik.errors.emergencyName ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.emergencyName}
                                    />
                                    {formik.touched.emergencyName && formik.errors.emergencyName && <FormFeedback>{formik.errors.emergencyName}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="emergencyPhone">Telefone</Label>
                                    <InputMask
                                        mask="(99) 99999-9999"
                                        id="emergencyPhone"
                                        name="emergencyPhone"
                                        className={`form-control ${formik.touched.emergencyPhone && formik.errors.emergencyPhone ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.emergencyPhone}
                                    />
                                    {formik.touched.emergencyPhone && formik.errors.emergencyPhone && <FormFeedback>{formik.errors.emergencyPhone}</FormFeedback>}
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label htmlFor="emergencyEmail">Email</Label>
                                    <input
                                        id="emergencyEmail"
                                        name="emergencyEmail"
                                        type="email"
                                        className={`form-control ${formik.touched.emergencyEmail && formik.errors.emergencyEmail ? 'is-invalid' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.emergencyEmail}
                                    />
                                    {formik.touched.emergencyEmail && formik.errors.emergencyEmail && <FormFeedback>{formik.errors.emergencyEmail}</FormFeedback>}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* DADOS DE SAÚDE (Opcional) */}
                    <div className="bg-light p-3 rounded">
                        <h5 className="font-size-14 text-uppercase mb-3 fw-bold text-primary">
                            <i className="mdi mdi-heart-pulse me-1"></i> Dados de Saúde
                        </h5>
                        <Row>
                            <Col md={12}>
                                <div className="mb-3">
                                    <Label htmlFor="healthObservations">Observações / Restrições Médicas</Label>
                                    <textarea
                                        id="healthObservations"
                                        name="healthObservations"
                                        rows="3"
                                        className="form-control"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.healthObservations}
                                        placeholder="Liste alergias, cirurgias recentes, dores crônicas ou medicamentos..."
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>

                </form>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={formik.isSubmitting}>Cancelar</Button>
                <Button color="primary" onClick={formik.handleSubmit} disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner size="sm" /> : "Salvar Cadastro"}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default ClientAddModal
