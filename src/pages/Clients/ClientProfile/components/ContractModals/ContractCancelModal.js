import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Row, Col, Alert, Badge } from 'reactstrap'
import ButtonLoader from '../../../../../components/Common/ButtonLoader'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import moment from 'moment'
import { formatDate, toISODate } from '../../../../../utils/date'
import { FormSwitch } from '../../../../../components/Common/FormSwitch'

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
            effectiveDate: toISODate(new Date()),
            cancellationFee: 0,
            cancelFutureReceivables: true,
            notes: ''
        },
        validationSchema: Yup.object({
            reason: Yup.string().required('Selecione o motivo'),
            notes: Yup.string().min(5, 'Descreva os detalhes').required('Obrigatório'),
            cancellationFee: Yup.number().min(0, 'Valor inválido'),
        }),
        onSubmit: (values) => {
            onConfirm(values)
        }
    })

    const todayIso = toISODate(new Date())
    const isFuture = moment(formik.values.effectiveDate).isAfter(todayIso, 'day')

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
                            <p className="mb-0 small">
                                {isFuture
                                    ? `O contrato será automaticamente encerrado em ${formatDate(formik.values.effectiveDate)}.`
                                    : "O cancelamento imediato encerrará o acesso do aluno e cessará novas cobranças automáticas."
                                }
                                Verifique as pendências financeiras abaixo.
                            </p>
                            {isFuture && (
                                <Badge color="soft-light" className="mt-2 text-danger">Agendamento de Cancelamento Ativado</Badge>
                            )}
                        </Alert>
                    )}

                    <Row>
                        <Col lg={7}>
                            <h5 className="font-size-15 mb-3 fw-bold text-dark">Informações Gerais</h5>
                            <Row className="g-3">
                                <Col md={6}>
                                    <FormGroup className="mb-4">
                                        <Label className="fw-semibold text-dark">
                                            Cancelar a partir de:
                                            <i className="mdi mdi-help-circle-outline ms-1 text-muted" title="Define a data real do encerramento. Parcelas vencendo após esta data serão tratadas conforme sua escolha ao lado."></i>
                                        </Label>
                                        <Input
                                            type="date"
                                            name="effectiveDate"
                                            onChange={formik.handleChange}
                                            value={formik.values.effectiveDate}
                                        />
                                    </FormGroup>
                                </Col>
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

                        <Col lg={5} className="border-start ps-4">
                            <h5 className="font-size-14 mb-4 fw-bold text-dark">Configurações Financeiras</h5>

                            <FormGroup className="mb-4">
                                <Label className="fw-semibold text-dark">
                                    Aplicar multa por cancelamento?
                                    <i className="mdi mdi-help-circle-outline ms-1 text-muted" title="Gera um novo título de 'Contas a Receber' para o aluno. Use para cobrar taxas de rescisão contratual."></i>
                                </Label>
                                <div className="input-group input-group-lg">
                                    <span className="input-group-text bg-light">R$</span>
                                    <Input
                                        type="number"
                                        name="cancellationFee"
                                        placeholder="0,00"
                                        onChange={formik.handleChange}
                                        value={formik.values.cancellationFee}
                                    />
                                </div>
                            </FormGroup>

                            <hr className="my-4" />

                            <div className="mb-4">
                                <FormSwitch
                                    id="cancelFutureReceivables"
                                    checked={formik.values.cancelFutureReceivables}
                                    onChange={(checked) => formik.setFieldValue('cancelFutureReceivables', checked)}
                                    label="Cancelar lançamentos futuros?"
                                    description="Recomendado para encerrar cobranças recorrentes no cartão/boleto."
                                    onColor="#ec4561"
                                />
                                <div className="ms-5 small text-muted">
                                    <i className="mdi mdi-help-circle-outline me-1"></i>
                                    Se ativado, todos os títulos 'Abertos' com vencimento após a data de cancelamento serão invalidados.
                                </div>
                            </div>

                            <div className="p-3 border rounded bg-soft-info small text-dark border-info mt-5">
                                <h6 className="font-size-12 fw-bold mb-1"><i className="mdi mdi-information-outline me-1"></i>Dica Financeira</h6>
                                O sistema calculará automaticamente o estorno de receita na DRE com base nas parcelas canceladas.
                            </div>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="secondary" outline onClick={toggle}>Manter Contrato</Button>
                    <ButtonLoader
                        color="danger"
                        type="submit"
                        className="px-4 shadow-sm"
                        loading={formik.isSubmitting}
                        loadingText={isFuture ? "Agendando..." : "Cancelando..."}
                    >
                        {isFuture ? "Agendar Cancelamento" : "Efetivar Cancelamento Agora"}
                    </ButtonLoader>
                </ModalFooter>
            </Form>
        </Modal >
    )
}

export default ContractCancelModal
