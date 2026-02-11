import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Row, Col, Alert } from 'reactstrap'
import ButtonLoader from '../../../../../components/Common/ButtonLoader'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { formatDate } from '../../../../../utils/date'
import moment from 'moment'

const ContractAdjustDaysModal = ({ isOpen, toggle, contract, mode, onConfirm }) => {
    const isAdding = mode === 'add'

    const formik = useFormik({
        initialValues: {
            days: 0,
            reason: '',
        },
        validationSchema: Yup.object({
            days: Yup.number().positive('O número de dias deve ser maior que zero').required('Obrigatório'),
            reason: Yup.string().min(5, 'Descreva melhor o motivo').required('Obrigatório'),
        }),
        onSubmit: (values) => {
            onConfirm({
                ...values,
                mode
            })
        }
    })

    const newEndDate = contract ? (
        isAdding
            ? moment(contract.endDate).add(formik.values.days || 0, 'days').toDate()
            : moment(contract.endDate).subtract(formik.values.days || 0, 'days').toDate()
    ) : null

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle} className="border-bottom text-dark">
                <i className={isAdding ? 'mdi mdi-calendar-plus me-2 text-info' : 'mdi mdi-calendar-remove me-2 text-warning'}></i>
                {isAdding ? 'Adicionar Dias ao Contrato' : 'Debitar Dias do Contrato'}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody className="p-4">
                    <div className="text-center mb-4">
                        <p className="text-muted mb-1">Término Atual</p>
                        <h5 className="fw-bold">{contract ? formatDate(contract.endDate) : '-'}</h5>
                        <i className="mdi mdi-arrow-down fs-4 text-muted"></i>
                        <p className="text-muted mb-1 mt-2">Novo Término Estimado</p>
                        <h4 className={isAdding ? 'text-info fw-bold' : 'text-danger fw-bold'}>
                            {newEndDate ? formatDate(newEndDate) : '-'}
                        </h4>
                    </div>

                    <Row className="g-3">
                        <Col md={12}>
                            <FormGroup className="mb-4">
                                <Label for="days" className="fw-semibold">Quantidade de Dias</Label>
                                <Input
                                    id="days"
                                    name="days"
                                    type="number"
                                    placeholder="Ex: 7"
                                    className="form-control-lg"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.days}
                                    invalid={formik.touched.days && !!formik.errors.days}
                                />
                                {formik.touched.days && formik.errors.days && <div className="invalid-feedback">{formik.errors.days}</div>}
                                <small className="text-muted font-size-12 mt-1 d-block">Indique quantos dias deseja adicionar ou remover do contrato.</small>
                            </FormGroup>
                        </Col>
                        <Col md={12}>
                            <FormGroup className="mb-0">
                                <Label for="reason" className="fw-semibold">Motivo do Ajuste</Label>
                                <Input
                                    id="reason"
                                    name="reason"
                                    type="textarea"
                                    rows="3"
                                    placeholder="Ex: Cortesia por indicação, ajuste de feriados..."
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.reason}
                                    invalid={formik.touched.reason && !!formik.errors.reason}
                                />
                                {formik.touched.reason && formik.errors.reason && <div className="invalid-feedback">{formik.errors.reason}</div>}
                            </FormGroup>
                        </Col>
                    </Row>

                    <Alert color="light" className="mb-0 mt-4 small border-0 bg-soft-light text-muted">
                        <i className="mdi mdi-information-outline me-1"></i>
                        Esta alteração será registrada no histórico de auditoria deste contrato para controle administrativo.
                    </Alert>
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="secondary" outline onClick={toggle}>
                        Cancelar
                    </Button>
                    <ButtonLoader
                        color={isAdding ? 'info' : 'warning'}
                        className="px-4"
                        type="submit"
                        loading={formik.isSubmitting}
                        loadingText="Salvando..."
                    >
                        {isAdding ? 'Adicionar Dias' : 'Debitar Dias'}
                    </ButtonLoader>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default ContractAdjustDaysModal
