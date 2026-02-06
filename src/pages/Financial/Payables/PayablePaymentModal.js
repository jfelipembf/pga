import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Row, Col, Label, Input, FormFeedback } from 'reactstrap';
import ButtonLoader from '../../../components/Common/ButtonLoader';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { formatCurrency } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { bankAccountRepository } from '../../../data/repositories/BankAccountRepository';
import { useTenant } from '../../../hooks/useTenant';

const PayablePaymentModal = ({ isOpen, toggle, payable, onPay }) => {
    const { idTenant, idBranch } = useTenant();
    const [bankAccounts, setBankAccounts] = useState([]);

    // Carregar contas bancárias
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    const accounts = await bankAccountRepository.findActive(idTenant, idBranch);
                    setBankAccounts(accounts);
                } catch (error) {
                    console.error("Erro ao carregar contas bancárias", error);
                }
            };
            loadData();
        }
    }, [isOpen, idTenant, idBranch]);

    const formik = useFormik({
        initialValues: {
            paymentDate: new Date().toISOString().split('T')[0],
            amountPaid: payable?.amount || 0,
            paymentMethod: payable?.paymentMethod || 'pix',
            idBankAccount: payable?.idBankAccount || '',
            notes: ''
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            paymentDate: Yup.date().required('Data obrigatória'),
            amountPaid: Yup.number().positive('Valor deve ser positivo').required('Obrigatório'),
            paymentMethod: Yup.string().required('Selecione a forma de pagamento'),
            idBankAccount: Yup.string().required('Selecione a conta de destino')
        }),
        onSubmit: (values) => {
            onPay({
                ...values,
                id: payable.id,
                amount: parseFloat(values.amountPaid)
            });
            toggle();
        }
    });

    if (!payable) return null;

    const amountPaid = parseFloat(formik.values.amountPaid || 0);
    const originalAmount = parseFloat(payable.amount || 0);
    const difference = originalAmount - amountPaid;

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
            <ModalHeader toggle={toggle}>
                Baixar Pagamento
            </ModalHeader>
            <ModalBody>
                {/* Informações da Despesa */}
                <div className="bg-light p-3 rounded mb-4 border">
                    <Row>
                        <Col md={6}>
                            <p className="mb-1 text-muted font-size-12"><strong>Fornecedor:</strong> {payable.supplier || 'Não informado'}</p>
                            <p className="mb-0 text-muted font-size-12"><strong>Descrição:</strong> {payable.description || payable.title}</p>
                        </Col>
                        <Col md={6} className="text-end">
                            <p className="mb-1 text-muted font-size-12"><strong>Vencimento:</strong> {formatDate(payable.dueDate)}</p>
                            <p className="mb-0"><strong>Valor:</strong> <span className="text-danger fw-bold">{formatCurrency(payable.amount)}</span></p>
                        </Col>
                    </Row>
                </div>

                {/* Formulário de Pagamento */}
                <form onSubmit={formik.handleSubmit}>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Label>Data do Pagamento *</Label>
                            <Input
                                name="paymentDate"
                                type="date"
                                value={formik.values.paymentDate}
                                onChange={formik.handleChange}
                                invalid={!!(formik.touched.paymentDate && formik.errors.paymentDate)}
                            />
                            {formik.errors.paymentDate && <FormFeedback>{formik.errors.paymentDate}</FormFeedback>}
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Valor Pago *</Label>
                            <Input
                                name="amountPaid"
                                type="number"
                                step="0.01"
                                value={formik.values.amountPaid}
                                onChange={formik.handleChange}
                                invalid={!!(formik.touched.amountPaid && formik.errors.amountPaid)}
                            />
                            {formik.errors.amountPaid && <FormFeedback>{formik.errors.amountPaid}</FormFeedback>}
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Label>Forma de Pagamento *</Label>
                            <Input
                                name="paymentMethod"
                                type="select"
                                value={formik.values.paymentMethod}
                                onChange={formik.handleChange}
                                invalid={!!(formik.touched.paymentMethod && formik.errors.paymentMethod)}
                            >
                                <option value="">Selecione...</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="ted">TED / Transferência</option>
                                <option value="boleto">Boleto</option>
                                <option value="cartao_corporativo">Cartão Corporativo</option>
                                <option value="cheque">Cheque</option>
                            </Input>
                            {formik.errors.paymentMethod && <FormFeedback>{formik.errors.paymentMethod}</FormFeedback>}
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Conta de Saída *</Label>
                            <Input
                                name="idBankAccount"
                                type="select"
                                value={formik.values.idBankAccount}
                                onChange={formik.handleChange}
                                invalid={!!(formik.touched.idBankAccount && formik.errors.idBankAccount)}
                            >
                                <option value="">Selecione...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} - {acc.bankName}
                                    </option>
                                ))}
                            </Input>
                            {formik.errors.idBankAccount && <FormFeedback>{formik.errors.idBankAccount}</FormFeedback>}
                            <small className="text-muted">De onde sairá o dinheiro</small>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12} className="mb-3">
                            <Label>Observações (Opcional)</Label>
                            <Input
                                name="notes"
                                type="textarea"
                                rows="2"
                                placeholder="Informações adicionais..."
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                            />
                        </Col>
                    </Row>

                    {/* Alertas de Diferença */}
                    {difference > 0.01 && (
                        <div className="mb-3 p-2 border rounded bg-light">
                            <small className="text-muted">
                                <strong>Atenção:</strong> Pagamento parcial de {formatCurrency(amountPaid)}.
                                Falta pagar: <strong>{formatCurrency(difference)}</strong>
                            </small>
                        </div>
                    )}

                    {difference < -0.01 && (
                        <div className="mb-3 p-2 border rounded bg-light">
                            <small className="text-muted">
                                <strong>Pagamento a maior:</strong> Diferença de {formatCurrency(Math.abs(difference))}
                            </small>
                        </div>
                    )}

                    {/* Resumo Final */}
                    <div className="border-top pt-3 mb-3">
                        <Row>
                            <Col>
                                <p className="mb-1 text-muted font-size-12">Valor a Debitar da Conta:</p>
                                <h4 className="text-danger mb-0">{formatCurrency(amountPaid)}</h4>
                            </Col>
                        </Row>
                    </div>

                    {/* Botões */}
                    <div className="d-flex justify-content-end gap-2">
                        <Button color="secondary" outline onClick={toggle} type="button">
                            Cancelar
                        </Button>
                        <ButtonLoader
                            color="success"
                            type="submit"
                            loading={formik.isSubmitting}
                            loadingText="Processando..."
                        >
                            <i className="mdi mdi-check me-1"></i> Confirmar Pagamento
                        </ButtonLoader>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default PayablePaymentModal;
