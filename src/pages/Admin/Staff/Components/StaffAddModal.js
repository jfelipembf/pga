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
import { useStaffForm } from "../hooks/useStaffForm"
// import { maskCPF, maskPhone } from "../../../../utils/maskUtils" // Removed manual masks in favor of react-input-mask
import PhotoPreview from "../../../../components/Common/PhotoPreview"
import OverlayLoader from "../../../../components/Common/OverlayLoader"
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import logoIcon from "../../../../assets/images/logoIcon.png"

const StaffAddModal = ({ isOpen, toggle, onStaffAdded, roles = [], loadingRoles = false }) => {
    const {
        formik,
        photoPreview,
        handlePhotoChange,
        handleCepBlur,
        isLoadingCep
    } = useStaffForm({ onStaffAdded, toggle, roles })

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
                        <h4 className="text-white fw-bold mb-0" style={{ fontSize: '1.1rem' }}>Novo Colaborador</h4>
                        <p className="text-white-50 mb-0 font-size-12">O colaborador terá acesso ao sistema com estes dados.</p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="p-4 position-relative">
                <OverlayLoader show={formik.isSubmitting} label="Criando acesso e salvando dados..." />

                <Row className="mb-4 g-4">
                    {/* Coluna da Foto */}
                    <Col lg="3" className="d-flex flex-column align-items-center border-end">
                        <PhotoPreview
                            inputId="staff-photo"
                            preview={photoPreview}
                            onChange={handlePhotoChange}
                            size={160}
                            rounded
                        />
                        <span className="text-muted small mt-2">Foto do perfil</span>
                    </Col>

                    {/* Dados Principais */}
                    <Col lg="9">
                        <h5 className="font-size-15 fw-bold mb-3 text-primary">
                            <i className="mdi mdi-account-details me-2"></i>Informações Básicas
                        </h5>
                        <Row className="g-3">
                            <Col md="12">
                                <FormGroup>
                                    <Label>Nome Completo <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
                                        placeholder="Digite o nome completo"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.name && !!formik.errors.name}
                                    />
                                    {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>E-mail (Login) <span className="text-danger">*</span></Label>
                                    <Input
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
                            <Col md="6">
                                <FormGroup>
                                    <Label>Cargo <span className="text-danger">*</span></Label>
                                    <Input
                                        type="select"
                                        name="roleId"
                                        value={formik.values.roleId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.roleId && !!formik.errors.roleId}
                                    >
                                        <option value="">{loadingRoles ? "Carregando cargos..." : "Selecione um cargo"}</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name || role.label}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.roleId && formik.errors.roleId && <FormFeedback>{formik.errors.roleId}</FormFeedback>}
                                </FormGroup>
                            </Col>
                        </Row>

                        <hr className="my-4" />

                        <h5 className="font-size-15 fw-bold mb-3 text-primary">
                            <i className="mdi mdi-lock-outline me-2"></i>Segurança (Acesso)
                        </h5>
                        <Row className="g-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Senha Temporária <span className="text-danger">*</span></Label>
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.password && !!formik.errors.password}
                                    />
                                    {formik.touched.password && formik.errors.password && <FormFeedback>{formik.errors.password}</FormFeedback>}
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Confirmar Senha <span className="text-danger">*</span></Label>
                                    <Input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Repita a senha"
                                        value={formik.values.confirmPassword}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                                    />
                                    {formik.touched.confirmPassword && formik.errors.confirmPassword && <FormFeedback>{formik.errors.confirmPassword}</FormFeedback>}
                                </FormGroup>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="font-size-15 fw-bold mb-3 text-secondary">
                    <i className="mdi mdi-map-marker-outline me-2"></i>Endereço Residencial
                </h5>
                <Row className="g-3">
                    <Col md="3">
                        <FormGroup>
                            <Label>CEP</Label>
                            <div className="position-relative">
                                <InputMask
                                    mask="99999-999"
                                    id="zipCode"
                                    name="zipCode"
                                    placeholder="00000-000"
                                    value={formik.values.zipCode}
                                    onChange={formik.handleChange}
                                    onBlur={handleCepBlur}
                                    className="form-control"
                                />
                                {isLoadingCep && (
                                    <div className="position-absolute end-0 top-0 mt-2 me-2">
                                        <Spinner size="sm" color="primary" />
                                    </div>
                                )}
                            </div>
                        </FormGroup>
                    </Col>
                    <Col md="6">
                        <FormGroup>
                            <Label>Logradouro/Rua</Label>
                            <Input
                                name="street"
                                placeholder="Rua, Av, etc"
                                value={formik.values.street}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Número</Label>
                            <Input
                                id="number"
                                name="number"
                                placeholder="123"
                                value={formik.values.number}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Complemento</Label>
                            <Input
                                name="complement"
                                placeholder="Apto, Bloco, etc"
                                value={formik.values.complement}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Bairro</Label>
                            <Input
                                name="neighborhood"
                                placeholder="Bairro"
                                value={formik.values.neighborhood}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Cidade</Label>
                            <Input
                                name="city"
                                placeholder="Cidade"
                                value={formik.values.city}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="2">
                        <FormGroup>
                            <Label>Estado (UF)</Label>
                            <Input
                                name="state"
                                placeholder="UF"
                                value={formik.values.state}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="font-size-15 fw-bold mb-3 text-secondary">
                    <i className="mdi mdi-briefcase-outline me-2"></i>Dados Profissionais
                </h5>
                <Row className="g-3">
                    <Col md="4">
                        <FormGroup>
                            <Label>Telefone Principal <span className="text-danger">*</span></Label>
                            <InputMask
                                mask="(99) 99999-9999"
                                id="phone"
                                name="phone"
                                placeholder="(00) 00000-0000"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
                            />
                            {formik.touched.phone && formik.errors.phone && <FormFeedback>{formik.errors.phone}</FormFeedback>}
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>CPF <span className="text-danger">*</span></Label>
                            <InputMask
                                mask="999.999.999-99"
                                id="cpf"
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formik.values.cpf}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`form-control ${formik.touched.cpf && formik.errors.cpf ? 'is-invalid' : ''}`}
                            />
                            {formik.touched.cpf && formik.errors.cpf && <FormFeedback>{formik.errors.cpf}</FormFeedback>}
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>Conselho Profissional (CRM/CREF)</Label>
                            <Input
                                name="professionalId"
                                placeholder="Número do registro"
                                value={formik.values.professionalId}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Data de Nascimento</Label>
                            <Input
                                name="birthDate"
                                type="date"
                                value={formik.values.birthDate}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Data de Contratação</Label>
                            <Input
                                name="hireDate"
                                type="date"
                                value={formik.values.hireDate}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <FormGroup>
                            <Label>Salário Base (R$)</Label>
                            <Input
                                name="salary"
                                type="number"
                                placeholder="0,00"
                                value={formik.values.salary}
                                onChange={formik.handleChange}
                            />
                        </FormGroup>
                    </Col>
                </Row>
            </ModalBody>

            <ModalFooter className="bg-light">
                <Button color="secondary" outline onClick={toggle} disabled={formik.isSubmitting}>
                    Cancelar
                </Button>
                <ButtonLoader
                    color="primary"
                    onClick={formik.handleSubmit}
                    loading={formik.isSubmitting}
                    className="px-4"
                    loadingText="Processando..."
                >
                    Salvar Colaborador
                </ButtonLoader>
            </ModalFooter>
        </Modal>
    )
}

export default StaffAddModal
