import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Row, Col, Alert, Badge } from 'reactstrap'
import ButtonLoader from '../../../../../components/Common/ButtonLoader'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import moment from 'moment'
import { formatDate, toISODate } from '../../../../../utils/date'

const ContractSuspendModal = ({ isOpen, toggle, contract, onConfirm }) => {

    const rules = contract?.rules || {}
    const canSuspend = rules.allowFreeze !== false
    const maxDays = rules.maxFreezeDays || 30

    const formik = useFormik({
        initialValues: {
            startDate: toISODate(new Date()),
            endDate: toISODate(moment().add(maxDays > 30 ? 30 : maxDays, 'days')),
            reason: ''
        },
        validationSchema: Yup.object({
            startDate: Yup.date().required('Obrigatório'),
            endDate: Yup.date()
                .required('Obrigatório')
                .min(Yup.ref('startDate'), 'A data final deve ser posterior à inicial')
                .test('max-days', `Máximo de ${maxDays} dias permitido`, function (value) {
                    const { startDate } = this.parent;
                    if (!startDate || !value) return true;
                    const diff = moment(value).diff(moment(startDate), 'days');
                    return diff <= maxDays;
                }),
            reason: Yup.string().min(5, 'Descreva o motivo').required('Obrigatório'),
        }),
        onSubmit: (values) => {
            const suspensionDays = moment(values.endDate).diff(moment(values.startDate), 'days');
            onConfirm({ ...values, suspensionDays });
        }
    })

    const todayIso = toISODate(new Date())
    const isFuture = moment(formik.values.startDate).isAfter(todayIso, 'day')
    const currentDays = moment(formik.values.endDate).diff(moment(formik.values.startDate), 'days') || 0;
    const totalUsed = contract?.suspension?.totalDaysUsed || 0
    const availableTotal = maxDays - totalUsed

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle} className="border-bottom text-dark">
                <i className="mdi mdi-pause-circle-outline me-2 text-warning"></i>
                Suspender Matrícula
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody className="p-4">
                    {!canSuspend && (
                        <Alert color="danger" className="text-center py-4 mb-4">
                            <i className="mdi mdi-lock-outline d-block font-size-24 mb-2"></i>
                            <h5 className="alert-heading font-size-14 fw-bold">Suspensão não permitida</h5>
                            <p className="mb-0 small">O plano <strong>{contract?.planName}</strong> não permite suspensão temporária.</p>
                        </Alert>
                    )}

                    <div className="text-center mb-4">
                        <h5 className="fw-bold">Pausa no Contrato</h5>
                        <p className="text-muted small">Defina o período em que o aluno ficará afastado.</p>

                        <div className="d-flex justify-content-center gap-2 mt-2">
                            <Badge color="soft-secondary" className="px-2 py-1">
                                Limite Total: {maxDays} dias
                            </Badge>
                            <Badge color="soft-danger" className="px-2 py-1">
                                Já Utilizados: {totalUsed} dias
                            </Badge>
                            <Badge color="soft-success" className="px-2 py-1 fw-bold">
                                Saldo Disponível: {availableTotal} dias
                            </Badge>
                        </div>
                        {isFuture && (
                            <div className="mt-3">
                                <Badge color="soft-info" className="px-3 py-2 font-size-12">
                                    <i className="mdi mdi-clock-outline me-1"></i>
                                    Ação Agendada para {formatDate(formik.values.startDate)}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <Row className="g-3" style={{ opacity: canSuspend ? 1 : 0.5, pointerEvents: canSuspend ? 'all' : 'none' }}>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-semibold">Data Início</Label>
                                <Input
                                    type="date"
                                    name="startDate"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.startDate}
                                    invalid={formik.touched.startDate && !!formik.errors.startDate}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-semibold">Data Reativação</Label>
                                <Input
                                    type="date"
                                    name="endDate"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.endDate}
                                    invalid={formik.touched.endDate && !!formik.errors.endDate}
                                />
                            </FormGroup>
                        </Col>

                        <Col md={12}>
                            <div className={`p-2 border-0 rounded text-center small ${currentDays > maxDays ? 'bg-soft-danger text-danger' : 'bg-soft-info text-info'}`}>
                                <i className="mdi mdi-calendar-clock me-1"></i>
                                Total de suspensão: <strong>{currentDays} dias</strong>
                                {formik.errors.endDate && currentDays > maxDays && (
                                    <div className="fw-bold mt-1">{formik.errors.endDate}</div>
                                )}
                            </div>
                        </Col>

                        <Col md={12}>
                            <FormGroup className="mb-0">
                                <Label className="fw-semibold">Motivo da Pausa</Label>
                                <Input
                                    type="textarea"
                                    name="reason"
                                    rows="3"
                                    placeholder="Ex: Viagem, licença médica..."
                                    onChange={formik.handleChange}
                                    value={formik.values.reason}
                                    invalid={formik.touched.reason && !!formik.errors.reason}
                                />
                                {formik.touched.reason && formik.errors.reason && (
                                    <div className="text-danger small mt-1">{formik.errors.reason}</div>
                                )}
                            </FormGroup>
                        </Col>
                    </Row>

                    <Alert color="info" className="mt-4 mb-0 small border-0 bg-soft-info text-dark shadow-none">
                        <i className="mdi mdi-information-outline me-1"></i>
                        As cobranças <strong>não serão pausadas</strong> automaticamente.
                    </Alert>
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="secondary" outline onClick={toggle}>Fechar</Button>
                    <ButtonLoader
                        color="warning"
                        type="submit"
                        className="px-4"
                        disabled={formik.isSubmitting || !canSuspend}
                        loading={formik.isSubmitting}
                        loadingText={isFuture ? "Agendando..." : "Suspendendo..."}
                    >
                        {isFuture ? "Agendar Suspensão" : "Confirmar Suspensão Agora"}
                    </ButtonLoader>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default ContractSuspendModal
