
import React from 'react';
import { Row, Col, Card, CardBody, Button, Label, Input, FormFeedback, FormGroup, Spinner } from "reactstrap";
import { FormikProvider, FieldArray, getIn } from "formik";
import InputMask from "react-input-mask";

// Components
import PhotoPreview from "../../../components/Common/PhotoPreview";
import ButtonLoader from "../../../components/Common/ButtonLoader";
import OverlayLoader from "../../../components/Common/OverlayLoader";

// Hooks
import { useCompanyForm } from "./hooks/useCompanyForm";

const CompanySettings = () => {
    const {
        formik,
        loading,
        saving,
        photoPreview,
        handlePhotoChange,
        handleCepBlur,
        isLoadingCep
    } = useCompanyForm();

    if (loading) {
        return <OverlayLoader show={true} />;
    }

    return (
        <React.Fragment>
            <Row>
                <Col lg="12">
                    <Card>
                        <CardBody>
                            <h4 className="card-title mb-4">Informações da Empresa</h4>

                            <FormikProvider value={formik}>
                                <form onSubmit={formik.handleSubmit}>
                                    <Row>
                                        {/* Logo Column */}
                                        <Col md="3" className="d-flex flex-column align-items-center mb-4 border-end">
                                            <PhotoPreview
                                                inputId="company-logo"
                                                preview={photoPreview}
                                                onChange={handlePhotoChange}
                                                size={160}
                                                placeholder="Logo"
                                                rounded={true}
                                            />
                                            <span className="text-muted mt-2">Logo da Empresa</span>
                                        </Col>

                                        {/* General Info Column */}
                                        <Col md="9">
                                            <Row>
                                                <Col md="6" className="mb-3">
                                                    <FormGroup>
                                                        <Label htmlFor="name">Nome da Academia</Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            type="text"
                                                            placeholder="Nome da Academia"
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            value={formik.values.name}
                                                            invalid={formik.touched.name && formik.errors.name ? true : false}
                                                        />
                                                        {formik.touched.name && formik.errors.name ? (
                                                            <FormFeedback>{formik.errors.name}</FormFeedback>
                                                        ) : null}
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3" className="mb-3">
                                                    <FormGroup>
                                                        <Label htmlFor="openingDate">Data de Abertura</Label>
                                                        <Input
                                                            id="openingDate"
                                                            name="openingDate"
                                                            type="date"
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            value={formik.values.openingDate}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md="6" className="mb-3">
                                                    <FormGroup>
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            placeholder="contato@academia.com"
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            value={formik.values.email}
                                                            invalid={formik.touched.email && formik.errors.email ? true : false}
                                                        />
                                                        {formik.touched.email && formik.errors.email ? (
                                                            <FormFeedback>{formik.errors.email}</FormFeedback>
                                                        ) : null}
                                                    </FormGroup>
                                                </Col>
                                                <Col md="6" className="mb-3">
                                                    <FormGroup>
                                                        <Label htmlFor="phone">Telefone</Label>
                                                        <InputMask
                                                            mask="(99) 99999-9999"
                                                            id="phone"
                                                            name="phone"
                                                            placeholder="(00) 00000-0000"
                                                            className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            value={formik.values.phone}
                                                        />
                                                        {formik.touched.phone && formik.errors.phone ? (
                                                            <FormFeedback className="d-block">{formik.errors.phone}</FormFeedback>
                                                        ) : null}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />

                                    <h5 className="font-size-14 mb-3">Endereço</h5>
                                    <Row>
                                        <Col md="3" className="mb-3">
                                            <FormGroup>
                                                <Label className="d-flex align-items-center gap-2">
                                                    CEP
                                                    {isLoadingCep && <Spinner size="sm" className="ms-1" />}
                                                </Label>
                                                <InputMask
                                                    mask="99999-999"
                                                    id="zipCode"
                                                    name="zipCode"
                                                    placeholder="00000-000"
                                                    className={`form-control ${formik.touched.zipCode && formik.errors.zipCode ? 'is-invalid' : ''}`}
                                                    onChange={formik.handleChange}
                                                    onBlur={handleCepBlur}
                                                    value={formik.values.zipCode}
                                                />
                                                {formik.touched.zipCode && formik.errors.zipCode ? (
                                                    <FormFeedback className="d-block">{formik.errors.zipCode}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="7" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="street">Endereço</Label>
                                                <Input
                                                    id="street"
                                                    name="street"
                                                    type="text"
                                                    placeholder="Rua, Avenida..."
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.street}
                                                    invalid={formik.touched.street && formik.errors.street ? true : false}
                                                />
                                                {formik.touched.street && formik.errors.street ? (
                                                    <FormFeedback>{formik.errors.street}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="2" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="number">Número</Label>
                                                <Input
                                                    id="number"
                                                    name="number"
                                                    type="text"
                                                    placeholder="Nº"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.number}
                                                    invalid={formik.touched.number && formik.errors.number ? true : false}
                                                />
                                                {formik.touched.number && formik.errors.number ? (
                                                    <FormFeedback>{formik.errors.number}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="4" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="neighborhood">Bairro</Label>
                                                <Input
                                                    id="neighborhood"
                                                    name="neighborhood"
                                                    type="text"
                                                    placeholder="Bairro"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.neighborhood}
                                                    invalid={formik.touched.neighborhood && formik.errors.neighborhood ? true : false}
                                                />
                                                {formik.touched.neighborhood && formik.errors.neighborhood ? (
                                                    <FormFeedback>{formik.errors.neighborhood}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="4" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="city">Cidade</Label>
                                                <Input
                                                    id="city"
                                                    name="city"
                                                    type="text"
                                                    placeholder="Cidade"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.city}
                                                    invalid={formik.touched.city && formik.errors.city ? true : false}
                                                />
                                                {formik.touched.city && formik.errors.city ? (
                                                    <FormFeedback>{formik.errors.city}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="1" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="state">UF</Label>
                                                <Input
                                                    id="state"
                                                    name="state"
                                                    type="text"
                                                    placeholder="UF"
                                                    maxLength="2"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.state}
                                                    invalid={formik.touched.state && formik.errors.state ? true : false}
                                                />
                                                {formik.touched.state && formik.errors.state ? (
                                                    <FormFeedback>{formik.errors.state}</FormFeedback>
                                                ) : null}
                                            </FormGroup>
                                        </Col>
                                        <Col md="3" className="mb-3">
                                            <FormGroup>
                                                <Label htmlFor="complement">Complemento</Label>
                                                <Input
                                                    id="complement"
                                                    name="complement"
                                                    type="text"
                                                    placeholder="Apto, Sala..."
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.complement}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />

                                    <h5 className="font-size-14 mb-3">Responsáveis</h5>
                                    <FieldArray
                                        name="managers"
                                        render={arrayHelpers => (
                                            <div>
                                                {formik.values.managers && formik.values.managers.length > 0 ? (
                                                    formik.values.managers.map((manager, index) => (
                                                        <div key={index} className="row mb-3 align-items-center">
                                                            <Col md="3">
                                                                <FormGroup className="mb-0">
                                                                    <Label className={index > 0 ? "d-none" : ""}>Nome</Label>
                                                                    <Input
                                                                        name={`managers.${index}.name`}
                                                                        placeholder="Nome do Responsável"
                                                                        value={manager.name}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={getIn(formik.touched, `managers.${index}.name`) && getIn(formik.errors, `managers.${index}.name`)}
                                                                    />
                                                                    {getIn(formik.touched, `managers.${index}.name`) && getIn(formik.errors, `managers.${index}.name`) && (
                                                                        <FormFeedback>{getIn(formik.errors, `managers.${index}.name`)}</FormFeedback>
                                                                    )}
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md="4">
                                                                <FormGroup className="mb-0">
                                                                    <Label className={index > 0 ? "d-none" : ""}>Email</Label>
                                                                    <Input
                                                                        name={`managers.${index}.email`}
                                                                        placeholder="email@exemplo.com"
                                                                        value={manager.email}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={getIn(formik.touched, `managers.${index}.email`) && getIn(formik.errors, `managers.${index}.email`)}
                                                                    />
                                                                    {getIn(formik.touched, `managers.${index}.email`) && getIn(formik.errors, `managers.${index}.email`) && (
                                                                        <FormFeedback>{getIn(formik.errors, `managers.${index}.email`)}</FormFeedback>
                                                                    )}
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md="3">
                                                                <FormGroup className="mb-0">
                                                                    <Label className={index > 0 ? "d-none" : ""}>Telefone</Label>
                                                                    <InputMask
                                                                        mask="(99) 99999-9999"
                                                                        value={manager.phone}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                    >
                                                                        {(inputProps) => (
                                                                            <Input
                                                                                {...inputProps}
                                                                                name={`managers.${index}.phone`}
                                                                                placeholder="(00) 00000-0000"
                                                                                invalid={getIn(formik.touched, `managers.${index}.phone`) && getIn(formik.errors, `managers.${index}.phone`)}
                                                                            />
                                                                        )}
                                                                    </InputMask>
                                                                    {getIn(formik.touched, `managers.${index}.phone`) && getIn(formik.errors, `managers.${index}.phone`) && (
                                                                        <FormFeedback className="d-block">{getIn(formik.errors, `managers.${index}.phone`)}</FormFeedback>
                                                                    )}
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md="2" className={index === 0 ? "mt-4" : ""}>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    outline
                                                                    onClick={() => arrayHelpers.remove(index)}
                                                                    disabled={formik.values.managers.length <= 1} // Prevent removing the only one? Or allow empty?
                                                                >
                                                                    <i className="mdi mdi-trash-can font-size-16"></i>
                                                                </Button>
                                                            </Col>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center">Nenhum responsável adicionado</div>
                                                )}
                                                <Button
                                                    color="success"
                                                    size="sm"
                                                    outline
                                                    className="mt-2"
                                                    onClick={() => arrayHelpers.push({ name: "", email: "", phone: "" })}
                                                >
                                                    <i className="mdi mdi-plus me-1"></i> Adicionar Responsável
                                                </Button>
                                            </div>
                                        )}
                                    />

                                    <div className="mt-4 d-flex justify-content-end">
                                        <ButtonLoader
                                            color="primary"
                                            type="submit"
                                            disabled={saving}
                                            loading={saving}
                                            className="px-4"
                                        >
                                            Salvar Alterações
                                        </ButtonLoader>
                                    </div>
                                </form>
                            </FormikProvider>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default CompanySettings;
