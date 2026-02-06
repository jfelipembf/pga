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
    FormGroup
} from "reactstrap"
import { useStaffForm } from "../hooks/useStaffForm"
import { maskCPF, maskPhone } from "../../../../utils/maskUtils"
import PhotoPreview from "../../../../components/Common/PhotoPreview"
import OverlayLoader from "../../../../components/Common/OverlayLoader"
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import logoIcon from "../../../../assets/images/logoIcon.png"

const StaffAddModal = ({ isOpen, toggle, onStaffAdded, roles = [], loadingRoles = false }) => {
    const {
        formik,
        photoPreview,
        handlePhotoChange
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
                    <i className="mdi mdi-information-outline me-2"></i>Informações Complementares
                </h5>
                <Row className="g-3">
                    <Col md="4">
                        <FormGroup>
                            <Label>Telefone</Label>
                            <Input
                                name="phone"
                                placeholder="(00) 00000-0000"
                                value={formik.values.phone}
                                onChange={(e) => formik.setFieldValue("phone", maskPhone(e.target.value))}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
                        <FormGroup>
                            <Label>CPF</Label>
                            <Input
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formik.values.cpf}
                                onChange={(e) => formik.setFieldValue("cpf", maskCPF(e.target.value))}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="4">
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
                    <Col md="4">
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
