import React from "react"
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Row,
    Col,
    Label,
    Input,
    FormFeedback,
    FormGroup,
    Spinner
} from "reactstrap"
import InputMask from "react-input-mask"

// Components & Utils
import PhotoPreview from "../../../components/Common/PhotoPreview"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import { GENDER_OPTIONS } from "../../../utils/constants"
import { useClientForm } from "../hooks/useClientForm"
import logoIcon from "../../../assets/images/logoIcon.png"

const ClientAddModal = ({ isOpen, toggle, onClientAdded }) => {
    const {
        formik,
        photoPreview,
        handlePhotoChange,
        isLoadingCep,
        handleCepBlur
    } = useClientForm({ onClientAdded, toggle })

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
                            height: '50px',
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)'
                        }}
                        className="me-3"
                    />
                    <div className="border-start border-white border-opacity-25 ps-3">
                        <h4 className="text-white fw-bold mb-0" style={{ fontSize: '1.1rem' }}>Novo Cliente</h4>
                        <p className="text-white-50 mb-0 font-size-12">Cadastre um novo aluno para iniciar as atividades.</p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="p-4 position-relative">
                <OverlayLoader show={formik.isSubmitting} label="Salvando dados do aluno..." />

                <Row className="mb-4 g-4">
                    {/* Coluna da Foto */}
                    <Col lg="3" className="d-flex flex-column align-items-center border-end">
                        <PhotoPreview
                            inputId="client-photo"
                            preview={photoPreview}
                            onChange={handlePhotoChange}
                            size={160}
                            rounded
                        />
                        <span className="text-muted small mt-2">Foto do aluno</span>
                    </Col>

                    {/* Dados Principais */}
                    <Col lg="9">
                        <h5 className="font-size-15 fw-bold mb-3 text-primary">
                            <i className="mdi mdi-account-details me-2"></i>Informações Pessoais
                        </h5>
                        <Row className="g-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Nome <span className="text-danger">*</span></Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="Primeiro nome"
                                        value={formik.values.firstName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.firstName && !!formik.errors.firstName}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && <FormFeedback>{formik.errors.firstName}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Sobrenome <span className="text-danger">*</span></Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Sobrenome completo"
                                        value={formik.values.lastName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.lastName && !!formik.errors.lastName}
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && <FormFeedback>{formik.errors.lastName}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="4">
                                <FormGroup>
                                    <Label>Data de Nascimento <span className="text-danger">*</span></Label>
                                    <Input
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        value={formik.values.birthDate}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.birthDate && !!formik.errors.birthDate}
                                    />
                                    {formik.touched.birthDate && formik.errors.birthDate && <FormFeedback>{formik.errors.birthDate}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="4">
                                <FormGroup>
                                    <Label>Sexo</Label>
                                    <Input
                                        id="gender"
                                        name="gender"
                                        type="select"
                                        value={formik.values.gender}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    >
                                        {GENDER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="4">
                                <FormGroup>
                                    <Label>CPF</Label>
                                    <Input
                                        tag={InputMask}
                                        mask="999.999.999-99"
                                        id="cpf"
                                        name="cpf"
                                        placeholder="000.000.000-00"
                                        value={formik.values.cpf}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.cpf && !!formik.errors.cpf}
                                    />
                                    {formik.touched.cpf && formik.errors.cpf && <FormFeedback>{formik.errors.cpf}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="8">
                                <FormGroup>
                                    <Label>Email <span className="text-danger">*</span></Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="exemplo@email.com"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.email && !!formik.errors.email}
                                    />
                                    {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="4">
                                <FormGroup>
                                    <Label>Telefone <span className="text-danger">*</span></Label>
                                    <Input
                                        tag={InputMask}
                                        mask="(99) 99999-9999"
                                        id="phone"
                                        name="phone"
                                        placeholder="(00) 00000-0000"
                                        value={formik.values.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.phone && !!formik.errors.phone}
                                    />
                                    {formik.touched.phone && formik.errors.phone && <FormFeedback>{formik.errors.phone}</FormFeedback>}
                                </FormGroup>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="font-size-15 fw-bold mb-3 text-primary">
                    <i className="mdi mdi-map-marker me-2"></i>Endereço
                </h5>
                <Row className="g-3">
                    <Col md="3">
                        <FormGroup>
                            <Label className="d-flex align-items-center gap-2">
                                CEP
                                {isLoadingCep && <Spinner size="sm" className="ms-1" />}
                            </Label>
                            <Input
                                tag={InputMask}
                                mask="99999-999"
                                id="zipCode"
                                name="zipCode"
                                placeholder="00000-000"
                                value={formik.values.zipCode}
                                onChange={formik.handleChange}
                                onBlur={(e) => {
                                    formik.handleBlur(e)
                                    handleCepBlur(e)
                                }}
                                invalid={formik.touched.zipCode && !!formik.errors.zipCode}
                            />
                            {formik.touched.zipCode && formik.errors.zipCode && <FormFeedback>{formik.errors.zipCode}</FormFeedback>}
                        </FormGroup>
                    </Col>
                    <Col md="7">
                        <FormGroup>
                            <Label>Rua</Label>
                            <Input
                                id="street"
                                name="street"
                                placeholder="Logradouro"
                                value={formik.values.street}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="2">
                        <FormGroup>
                            <Label>Número</Label>
                            <Input
                                id="number"
                                name="number"
                                placeholder="00"
                                value={formik.values.number}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Bairro</Label>
                            <Input
                                id="neighborhood"
                                name="neighborhood"
                                placeholder="Bairro"
                                value={formik.values.neighborhood}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Cidade</Label>
                            <Input
                                id="city"
                                name="city"
                                placeholder="Cidade"
                                value={formik.values.city}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="1">
                        <FormGroup>
                            <Label>UF</Label>
                            <Input
                                id="state"
                                name="state"
                                placeholder="UF"
                                maxLength={2}
                                value={formik.values.state}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Complemento</Label>
                            <Input
                                id="complement"
                                name="complement"
                                placeholder="Apto, Sala, etc"
                                value={formik.values.complement}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="font-size-15 fw-bold mb-3 text-secondary">
                    <i className="mdi mdi-alert-circle-outline me-2"></i>Emergência e Saúde
                </h5>
                <Row className="g-3">
                    <Col md="4">
                        <FormGroup>
                            <Label>Nome do Contato</Label>
                            <Input
                                id="emergencyName"
                                name="emergencyName"
                                placeholder="Nome do representante"
                                value={formik.values.emergencyName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Telefone de Emergência</Label>
                            <Input
                                tag={InputMask}
                                mask="(99) 99999-9999"
                                id="emergencyPhone"
                                name="emergencyPhone"
                                placeholder="(00) 00000-0000"
                                value={formik.values.emergencyPhone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Email de Emergência</Label>
                            <Input
                                id="emergencyEmail"
                                name="emergencyEmail"
                                type="email"
                                placeholder="representante@email.com"
                                value={formik.values.emergencyEmail}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="12">
                        <FormGroup>
                            <Label>Observações / Restrições Médicas</Label>
                            <textarea
                                id="healthObservations"
                                name="healthObservations"
                                rows="3"
                                className="form-control"
                                placeholder="Alergias, medicamentos, dores crônicas ou restrições importantes..."
                                value={formik.values.healthObservations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormGroup>
                    </Col>
                </Row>
            </ModalBody>

            <ModalFooter className="bg-light">
                <Button color="secondary" outline onClick={toggle} disabled={formik.isSubmitting}>
                    Cancelar
                </Button>
                <Button color="primary" onClick={formik.handleSubmit} disabled={formik.isSubmitting} className="px-4">
                    {formik.isSubmitting ? "Sessão sendo salva..." : "Salvar Cadastro"}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default ClientAddModal
