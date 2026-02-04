import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Row, Col, Alert, Card, CardBody } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import moment from 'moment'

const ContractCancelModal = ({ isOpen, toggle, contract, onConfirm }) => {
    const rules = contract?.rules || {}
    const minPermanence = rules.minPermanence || 0

    // Cálculo de tempo ativo
    const startDate = contract?.startDate?.seconds ? new Date(contract.startDate.seconds * 1000) : new Date(contract?.startDate)
    const monthsActive = moment().diff(moment(startDate), 'months')
    const isUnderPermanence = monthsActive < minPermanence

    const formik = useFormik({
        initialValues: {
            reason: '',
            cancellationFee: 0,
            refundAmount: 0,
            settlementType: 'none', // none, refund, credit
            notes: ''
        },
        validationSchema: Yup.object({
            reason: Yup.string().required('Selecione o motivo do cancelamento'),
            notes: Yup.string().min(5, 'Descreva os detalhes do cancelamento').required('Obrigatório'),
            cancellationFee: Yup.number().min(0, 'Valor inválido'),
            refundAmount: Yup.number().min(0, 'Valor inválido'),
        }),
        onSubmit: (values) => {
            onConfirm(values)
        }
    })

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle} className="border-bottom text-dark">
                <i className="mdi mdi-close-circle-outline me-2 text-danger"></i>
                Cancelar Contrato Definitivamente
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody className="p-4">
                    {isUnderPermanence ? (
                        <Alert color="warning" className="mb-4 border-0 shadow-sm bg-soft-warning text-dark">
                            <div className="d-flex">
                                <i className="mdi mdi-alert-decagram-outline font-size-24 me-3 text-warning"></i>
                                <div>
                                    <h5 className="font-size-14 fw-bold mb-1">Aviso de Permanência Mínima</h5>
                                    <p className="mb-0 small">
                                        Este contrato exige <strong>{minPermanence} meses</strong> de permanência.
                                        O aluno está ativo há apenas <strong>{monthsActive} meses</strong>.
                                        Verifique a aplicação de multa rescisória no campo ao lado.
                                    </p>
                                </div>
                            </div>
                        </Alert>
                    ) : (
                        <Alert color="danger" className="mb-4">
                            <h5 className="alert-heading font-size-14"><i className="mdi mdi-alert-outline me-2"></i>Atenção: Ação Irreversível</h5>
                            <p className="mb-0 small">O cancelamento encerrará o acesso do aluno e cessará novas cobranças automáticas. Verifique as pendências financeiras abaixo.</p>
                        </Alert>
                    )}

                    <Row>
                        <Col lg={7}>
                            <h5 className="font-size-15 mb-3 fw-bold text-dark">Informações Gerais</h5>
                            <Row className="g-3">
                                <Col md={12}>
                                    <FormGroup className="mb-4">
                                        <Label className="fw-semibold text-dark">Motivo do Cancelamento</Label>
                                        <Input
                                            type="select"
                                            name="reason"
                                            className="form-control-lg"
                                            onChange={formik.handleChange}
                                            value={formik.values.reason}
                                            invalid={formik.touched.reason && !!formik.errors.reason}
                                        >
                                            <option value="">Selecione o motivo...</option>
                                            <option value="desistencia">Desistência do Aluno</option>
                                            <option value="mudanca">Mudança de Endereço</option>
                                            <option value="insatisfacao">Insatisfação com Serviço</option>
                                            <option value="financeiro">Motivos Financeiros</option>
                                            <option value="doenca">Motivos de Saúde</option>
                                            <option value="outro">Outro Motivo</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={12}>
                                    <FormGroup className="mb-0">
                                        <Label className="fw-semibold text-dark">Observações Adicionais</Label>
                                        <Input
                                            type="textarea"
                                            name="notes"
                                            rows="5"
                                            placeholder="Detalhes sobre a conversa com o aluno..."
                                            onChange={formik.handleChange}
                                            value={formik.values.notes}
                                            invalid={formik.touched.notes && !!formik.errors.notes}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>

                        <Col lg={5} className="border-start">
                            <h5 className="font-size-14 mb-3 fw-bold text-dark ps-2">Acerto Financeiro</h5>
                            <div className="ps-2">
                                <Card className="bg-light border-0 mb-3">
                                    <CardBody className="p-3">
                                        <FormGroup className="mb-3">
                                            <Label className="small text-muted text-uppercase mb-1">Ajuste / Multa Rescisória</Label>
                                            <div className="input-group">
                                                <span className="input-group-text font-size-12">R$</span>
                                                <Input
                                                    type="number"
                                                    name="cancellationFee"
                                                    placeholder="0,00"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.cancellationFee}
                                                />
                                            </div>
                                            <small className="text-muted">Valor a ser cobrado do aluno</small>
                                        </FormGroup>

                                        <FormGroup className="mb-0">
                                            <Label className="small text-muted text-uppercase mb-1">Tratamento de Crédito</Label>
                                            <div className="d-flex flex-column gap-2 mt-2">
                                                <div className="form-check font-size-13">
                                                    <Input
                                                        type="radio"
                                                        name="settlementType"
                                                        value="none"
                                                        id="set_none"
                                                        checked={formik.values.settlementType === 'none'}
                                                        onChange={formik.handleChange}
                                                    />
                                                    <Label check for="set_none">Nenhum reembolso</Label>
                                                </div>
                                                <div className="form-check font-size-13">
                                                    <Input
                                                        type="radio"
                                                        name="settlementType"
                                                        value="refund"
                                                        id="set_refund"
                                                        checked={formik.values.settlementType === 'refund'}
                                                        onChange={formik.handleChange}
                                                    />
                                                    <Label check for="set_refund">Reembolso via Caixa/Banco</Label>
                                                </div>
                                                <div className="form-check font-size-13">
                                                    <Input
                                                        type="radio"
                                                        name="settlementType"
                                                        value="credit"
                                                        id="set_credit"
                                                        checked={formik.values.settlementType === 'credit'}
                                                        onChange={formik.handleChange}
                                                    />
                                                    <Label check for="set_credit">Deixar como crédito (Devolução)</Label>
                                                </div>
                                            </div>
                                        </FormGroup>

                                        {formik.values.settlementType !== 'none' && (
                                            <FormGroup className="mt-3">
                                                <Label className="small fw-bold">Valor do Reembolso/Crédito</Label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">R$</span>
                                                    <Input
                                                        type="number"
                                                        name="refundAmount"
                                                        onChange={formik.handleChange}
                                                        value={formik.values.refundAmount}
                                                    />
                                                </div>
                                            </FormGroup>
                                        )}
                                    </CardBody>
                                </Card>

                                <div className="p-2 border rounded bg-soft-warning small text-dark">
                                    <i className="mdi mdi-lightbulb-on-outline me-1"></i>
                                    <strong>Dica:</strong> Parcelas futuras em aberto serão canceladas automaticamente.
                                </div>
                            </div>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="secondary" outline className="btn-rounded" onClick={toggle}>Manter Contrato</Button>
                    <Button color="danger" type="submit" className="btn-rounded px-4 shadow-sm" disabled={formik.isSubmitting}>
                        Efetivar Cancelamento
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default ContractCancelModal
