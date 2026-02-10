import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Row, Col, Label, Input, FormFeedback, Alert } from 'reactstrap';
import { FormSwitch } from '../../../components/Common/FormSwitch';
import ButtonLoader from '../../../components/Common/ButtonLoader';
import CurrencyInput from '../../../components/Common/CurrencyInput';
import { useFormik } from 'formik';
import { receivableSettlementSchema } from '../../../validations/financialSchemas';
import { formatCurrency } from '../../../utils/format';
import { bankAccountRepository } from '../../../data/repositories/BankAccountRepository';
import { AcquirerService } from '../../../services/Financial/AcquirerService';
import { PAYMENT_METHODS } from '../../../utils/constants';
import { useTenant } from '../../../hooks/useTenant';

const ReceivableSettlementModal = ({ isOpen, toggle, receivable, onSettle }) => {
    const { idTenant, idBranch } = useTenant();
    const [bankAccounts, setBankAccounts] = useState([]);
    const [acquirers, setAcquirers] = useState([]);

    // Carregar contas bancárias e adquirentes
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    const [accounts, acqs] = await Promise.all([
                        bankAccountRepository.findActive(idTenant, idBranch),
                        AcquirerService.listAll(idTenant, idBranch)
                    ]);
                    setBankAccounts(accounts);
                    setAcquirers(acqs.filter(a => a.isActive));
                } catch (error) {
                    console.error("Erro ao carregar dados auxiliares", error);
                }
            };
            loadData();
        }
    }, [isOpen, idTenant, idBranch]);

    const formik = useFormik({
        initialValues: {
            settlementDate: new Date().toISOString().split('T')[0],
            amountReceived: receivable?.amount || 0,
            additions: 0,
            discounts: 0,
            paymentMethod: receivable?.paymentMethod || '',
            idBankAccount: '',
            provider: '',
            brand: '',
            auth: '',
            installments: '1',
            notes: '',
            keepRemainingOpen: false
        },
        enableReinitialize: true,
        validationSchema: receivableSettlementSchema,
        onSubmit: (values) => {
            onSettle({
                ...values,
                id: receivable.id,
                totalAmount: parseFloat(values.amountReceived),
                estimatedFee: estimatedFee
            });
            toggle();
        }
    });

    // 1. Calcular taxa estimada (Reutilizado da Vendas)
    const estimatedFee = useMemo(() => {
        const { paymentMethod, provider, brand, installments } = formik.values;
        if (!provider || !brand || !acquirers.length) return 0;
        if (![PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.DEBIT_CARD].includes(paymentMethod)) return 0;

        const acquirer = acquirers.find(a => a.id === provider);
        if (!acquirer) return 0;

        const config = acquirer.rateConfigs?.find(c => c.brands?.includes(brand));
        if (!config) return 0;

        if (paymentMethod === PAYMENT_METHODS.DEBIT_CARD) {
            return config.fees?.debitCard || 0;
        } else {
            const inst = parseInt(installments) || 1;
            if (inst === 1) return config.fees?.creditCard1x || 0;
            return config.fees?.[`creditCard${inst}x`] || 0;
        }
    }, [formik.values, acquirers]);

    // 2. Calcular Valor Líquido
    const amountReceived = parseFloat(formik.values.amountReceived || 0);
    const feeAmount = amountReceived * (estimatedFee / 100);
    const netValue = amountReceived - feeAmount;

    if (!receivable) return null;

    const originalAmount = parseFloat(receivable.amount || 0);
    const received = amountReceived;
    const difference = received - originalAmount;

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
                Baixar Recebimento
            </ModalHeader>
            <ModalBody className="p-4">
                <div className="bg-light p-3 rounded mb-4 border">
                    <Row>
                        <Col md={6}>
                            <small className="text-muted text-uppercase fw-bold">Cliente</small>
                            <h5 className="text-dark mb-0">{receivable.clientName}</h5>
                        </Col>
                        <Col md={6} className="text-end">
                            <small className="text-muted text-uppercase fw-bold">Valor Original</small>
                            <h4 className="text-dark mb-0">{formatCurrency(originalAmount)}</h4>
                        </Col>
                    </Row>
                </div>

                <form onSubmit={formik.handleSubmit}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Label className="form-label fw-bold">Data do Recebimento *</Label>
                            <Input
                                type="date"
                                name="settlementDate"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.settlementDate}
                                invalid={formik.touched.settlementDate && formik.errors.settlementDate}
                            />
                            {formik.touched.settlementDate && formik.errors.settlementDate && (
                                <FormFeedback>{formik.errors.settlementDate}</FormFeedback>
                            )}
                        </Col>
                        <Col md={6}>
                            <Label className="form-label fw-bold">Forma de Pagamento Real *</Label>
                            <Input
                                type="select"
                                name="paymentMethod"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.paymentMethod}
                                invalid={formik.touched.paymentMethod && formik.errors.paymentMethod}
                            >
                                <option value="">Selecione...</option>
                                <option value="credit_card">Cartão de Crédito</option>
                                <option value="debit_card">Cartão de Débito</option>
                                <option value="pix">PIX</option>
                                <option value="money">Dinheiro</option>
                                <option value="bank_slip">Boleto</option>
                            </Input>
                            {formik.touched.paymentMethod && formik.errors.paymentMethod && (
                                <FormFeedback>{formik.errors.paymentMethod}</FormFeedback>
                            )}
                        </Col>

                        {([PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.DEBIT_CARD].includes(formik.values.paymentMethod)) && (
                            <React.Fragment>
                                <Col md={3}>
                                    <Label className="form-label fw-bold">Máquina *</Label>
                                    <Input
                                        type="select"
                                        name="provider"
                                        onChange={formik.handleChange}
                                        value={formik.values.provider}
                                        invalid={formik.touched.provider && formik.errors.provider}
                                    >
                                        <option value="">Selecione...</option>
                                        {acquirers.map(acq => (
                                            <option key={acq.id} value={acq.id}>{acq.name}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={3}>
                                    <Label className="form-label fw-bold">Bandeira *</Label>
                                    <Input
                                        type="select"
                                        name="brand"
                                        onChange={formik.handleChange}
                                        value={formik.values.brand}
                                        invalid={formik.touched.brand && formik.errors.brand}
                                        disabled={!formik.values.provider}
                                    >
                                        <option value="">Selecione...</option>
                                        {(() => {
                                            if (!formik.values.provider) return null;
                                            const acq = acquirers.find(a => a.id === formik.values.provider);
                                            const brands = [];
                                            acq?.rateConfigs?.forEach(config => {
                                                config.brands?.forEach(b => {
                                                    if (!brands.includes(b)) brands.push(b);
                                                });
                                            });
                                            return brands.map(b => (
                                                <option key={b} value={b}>{b.toUpperCase()}</option>
                                            ));
                                        })()}
                                    </Input>
                                </Col>
                                <Col md={3}>
                                    <Label className="form-label fw-bold">Autorização</Label>
                                    <Input
                                        type="text"
                                        name="auth"
                                        placeholder="Código"
                                        onChange={formik.handleChange}
                                        value={formik.values.auth}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Label className="form-label fw-bold">Parcelas</Label>
                                    <Input
                                        type="select"
                                        name="installments"
                                        disabled={formik.values.paymentMethod === PAYMENT_METHODS.DEBIT_CARD}
                                        onChange={formik.handleChange}
                                        value={formik.values.installments}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                                            <option key={i} value={i}>{i}x</option>
                                        ))}
                                    </Input>
                                </Col>
                            </React.Fragment>
                        )}

                        {estimatedFee > 0 && (
                            <Col md={12}>
                                <div className="p-2 px-3 bg-light-subtle rounded border d-flex justify-content-between align-items-center">
                                    <span className="text-muted font-size-12">
                                        <i className="mdi mdi-information-outline me-1"></i>
                                        Taxa Estimada: <strong>{estimatedFee}%</strong>
                                    </span>
                                    <span className="text-dark">
                                        Valor Líquido: <strong className="text-success">{formatCurrency(netValue)}</strong>
                                    </span>
                                </div>
                            </Col>
                        )}

                        <Col md={12}>
                            <Label className="form-label fw-bold">Conta de Destino *</Label>
                            <Input
                                type="select"
                                name="idBankAccount"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.idBankAccount}
                                invalid={formik.touched.idBankAccount && formik.errors.idBankAccount}
                            >
                                <option value="">Selecione...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bankName})
                                    </option>
                                ))}
                            </Input>
                            {formik.touched.idBankAccount && formik.errors.idBankAccount && (
                                <FormFeedback>{formik.errors.idBankAccount}</FormFeedback>
                            )}
                        </Col>

                        <Col md={12}>
                            <hr className="my-2 opacity-25" />
                        </Col>

                        <Col md={4}>
                            <Label className="form-label fw-bold">Juros / Multa (+)</Label>
                            <CurrencyInput
                                name="additions"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.additions}
                            />
                        </Col>
                        <Col md={4}>
                            <Label className="form-label fw-bold">Descontos (-)</Label>
                            <CurrencyInput
                                name="discounts"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.discounts}
                            />
                        </Col>
                        <Col md={4}>
                            <Label className="form-label fw-bold text-success">Valor Final Recebido *</Label>
                            <CurrencyInput
                                name="amountReceived"
                                className="fw-bold form-control-lg"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.amountReceived}
                            />
                        </Col>

                        {difference < -0.01 && (
                            <Col md={12}>
                                <Alert color="warning" className="d-flex align-items-center mb-0 py-2 shadow-sm border-warning border-opacity-25">
                                    <div className="flex-grow-1">
                                        <i className="mdi mdi-alert-circle-outline me-2"></i>
                                        O valor recebido é <strong>R$ {formatCurrency(Math.abs(difference))} menor</strong> que o original.
                                    </div>
                                    <FormSwitch
                                        id="keepRemainingOpen"
                                        checked={formik.values.keepRemainingOpen}
                                        onChange={(checked) => formik.setFieldValue('keepRemainingOpen', checked)}
                                        label="Manter resíduo?"
                                        onColor="#f8b425"
                                    />
                                </Alert>
                            </Col>
                        )}

                        {difference > 0.01 && (
                            <Col md={12}>
                                <Alert color="info" className="font-size-12 mb-0 py-2">
                                    <i className="mdi mdi-plus-circle-outline me-1"></i>
                                    O valor excedente de <strong>R$ {formatCurrency(difference)}</strong> será registrado como juros/multa.
                                </Alert>
                            </Col>
                        )}

                        <Col md={12}>
                            <Label className="form-label fw-bold">Observações</Label>
                            <Input
                                type="textarea"
                                rows="2"
                                name="notes"
                                onChange={formik.handleChange}
                                value={formik.values.notes}
                                placeholder="Detalhes da transação..."
                            />
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button color="light" onClick={toggle}>Cancelar</Button>
                        <ButtonLoader
                            type="submit"
                            color="primary"
                            className="px-5 fw-bold btn-lg"
                            loading={formik.isSubmitting}
                            loadingText="Processando..."
                        >
                            <i className="mdi mdi-check-circle-outline me-1"></i> CONFIRMAR BAIXA
                        </ButtonLoader>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default ReceivableSettlementModal;
