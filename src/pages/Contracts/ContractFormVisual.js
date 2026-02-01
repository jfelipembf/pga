import React from "react"
import { Row, Col, Label, Input, Button, Form, InputGroup, FormFeedback } from "reactstrap"
import Select from "react-select"
import { useFormik } from "formik"
import { FormSwitch } from "../../components/Common/FormSwitch"
import { WeekDaySelector } from "../../components/Common/WeekDaySelector"
import { ContractSchema, contractInitialValues } from "../../data/schemas/Financial/ContractSchema"

export const ContractFormVisual = ({ initialData, onSave, onCancel, branches = [] }) => {

    const formik = useFormik({
        initialValues: { ...contractInitialValues, ...initialData },
        validationSchema: ContractSchema,
        enableReinitialize: true,
        onSubmit: onSave
    })

    const branchOptions = React.useMemo(() => branches.map(b => ({
        value: b.idBranch,
        label: b.name || b.idBranch
    })), [branches])

    const selectedBranches = React.useMemo(() =>
        branchOptions.filter(opt => formik.values.allowedBranches?.includes(opt.value))
        , [branchOptions, formik.values.allowedBranches])

    return (
        <div className="p-3 bg-white rounded shadow-sm border">
            {/* CABEÇALHO SIMPLES */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h4 className="mb-0 text-dark">
                    {initialData ? `Editar: ${initialData.title}` : 'Novo Plano'}
                </h4>
                <div className="d-flex gap-2">
                    <Button color="secondary" outline onClick={onCancel} type="button">Cancelar</Button>
                    <Button color="primary" onClick={formik.handleSubmit}>Salvar Plano</Button>
                </div>
            </div>

            {/* VALIDATION ERROR BANNER */}
            {Object.keys(formik.errors).length > 0 && (
                <div className="alert alert-danger mb-3" role="alert">
                    <h6 className="alert-heading mb-2">
                        <i className="mdi mdi-alert-circle-outline me-2"></i>
                        Erros de Validação
                    </h6>
                    <ul className="mb-0 small">
                        {Object.entries(formik.errors).map(([field, error]) => (
                            <li key={field}><strong>{field}:</strong> {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Form onSubmit={formik.handleSubmit}>

                {/* 1. DADOS GERAIS */}
                <div className="mb-5">
                    <h6 className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '12px' }}>Dados do Plano</h6>
                    <Row>
                        <Col md={8} className="mb-3">
                            <Label>Nome do Plano</Label>
                            <Input
                                name="title"
                                placeholder="Ex: Plano Anual Gold"
                                {...formik.getFieldProps('title')}
                                invalid={!!(formik.touched.title && formik.errors.title)}
                            />
                            {formik.errors.title && <FormFeedback>{formik.errors.title}</FormFeedback>}
                        </Col>
                        <Col md={4} className="mb-3">
                            <Label>Status (Ativo)</Label>
                            <div className="mt-1">
                                <FormSwitch
                                    id="contractStatus"
                                    checked={!!formik.values.isActive}
                                    onChange={(val) => formik.setFieldValue("isActive", val)}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4} className="mb-3">
                            <Label>Valor Total (R$)</Label>
                            <Input
                                name="price"
                                type="number"
                                step="0.01"
                                {...formik.getFieldProps('price')}
                                invalid={!!(formik.touched.price && formik.errors.price)}
                            />
                        </Col>
                        <Col md={4} className="mb-3">
                            <Label>Parcelamento Máximo</Label>
                            <Input name="maxInstallments" type="number" {...formik.getFieldProps('maxInstallments')} />
                        </Col>
                        <Col md={4} className="mb-3">
                            <Label>Permanência Mínima (Meses)</Label>
                            <Input name="minPermanence" type="number" {...formik.getFieldProps('minPermanence')} />
                        </Col>
                    </Row>
                </div>

                {/* 2. DURAÇÃO E ACESSO */}
                <div className="mb-5 shadow-none border-top pt-4">
                    <h6 className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '12px' }}>Duração e Regras de Acesso</h6>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Label>Tempo de Duração</Label>
                            <InputGroup>
                                <Input name="duration" type="number" {...formik.getFieldProps('duration')} />
                                <Input name="durationType" type="select" style={{ maxWidth: '120px' }} {...formik.getFieldProps('durationType')}>
                                    <option value="months">Meses</option>
                                    <option value="days">Dias</option>
                                    <option value="years">Anos</option>
                                </Input>
                            </InputGroup>
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Tipo de Frequência</Label>
                            <Input
                                name="accessLimitType"
                                type="select"
                                value={formik.values.accessLimitType}
                                onChange={e => {
                                    formik.handleChange(e);
                                    if (e.target.value === 'unlimited') {
                                        formik.setFieldValue('accessLimitQuantity', null);
                                    }
                                }}
                            >
                                <option value="unlimited">Uso Livre (Ilimitado)</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensal</option>
                                <option value="total">Pacote de Sessões (Total)</option>
                            </Input>
                        </Col>
                    </Row>

                    {formik.values.accessLimitType !== 'unlimited' && (
                        <Row className="mb-3">
                            <Col md={6}>
                                <Label>Quantidade de Acessos</Label>
                                <Input name="accessLimitQuantity" type="number" {...formik.getFieldProps('accessLimitQuantity')} />
                            </Col>
                        </Row>
                    )}

                    <Row className="mt-2">
                        <Col md={12}>
                            <Label>Dias da Semana Permitidos</Label>
                            <div className="p-2 border rounded bg-light bg-opacity-50">
                                <WeekDaySelector selectedDays={formik.values.allowedWeekDays} onChange={val => formik.setFieldValue('allowedWeekDays', val)} />
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 3. UNIDADES E EXTRAS */}
                <div className="mb-4 border-top pt-4">
                    <h6 className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '12px' }}>Unidades e Extras</h6>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Label>Liberar Unidade de Origem?</Label>
                            <div className="mt-1">
                                <FormSwitch id="unlimitedInOrigin" checked={!!formik.values.unlimitedInOrigin} onChange={val => formik.setFieldValue("unlimitedInOrigin", val)} />
                            </div>
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Outras Unidades Permitidas</Label>
                            <Select
                                isMulti
                                options={branchOptions}
                                value={selectedBranches}
                                onChange={opts => formik.setFieldValue('allowedBranches', opts?.map(o => o.value) || [])}
                                placeholder="Selecionar..."
                                classNamePrefix="select2-selection"
                            />
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col md={6} className="mb-3">
                            <Label>Permitir Trancamento?</Label>
                            <div className="mt-1">
                                <FormSwitch id="allowFreeze" checked={!!formik.values.allowFreeze} onChange={val => formik.setFieldValue("allowFreeze", val)} />
                            </div>
                        </Col>
                        {formik.values.allowFreeze && (
                            <Col md={6} className="mb-3">
                                <Label>Máximo de Dias de Trancamento</Label>
                                <Input name="maxFreezeDays" type="number" {...formik.getFieldProps('maxFreezeDays')} />
                            </Col>
                        )}
                    </Row>
                </div>
            </Form>
        </div>
    )
}
