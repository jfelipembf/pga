import React, { useState } from 'react';
import { Card, CardBody, Button, Badge, Input, InputGroup, InputGroupText } from 'reactstrap';
import { formatCurrency } from '../../../../utils/format';
import { PAYMENT_METHODS } from '../../../../utils/constants';

const SalesCartPanel = ({ cartItems, payments, totals, onRemoveItem, onRemovePayment, onProceed }) => {
    const [dueDate, setDueDate] = useState('');

    // Cálculos de Totais (Usa totals do hook se disponível, senão recalcula)
    const subtotal = totals?.subtotal ?? cartItems.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    const totalPaid = totals?.totalPaid ?? payments.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
    const balance = totals?.balance ?? (subtotal - totalPaid);

    const handleFinalize = () => {
        onProceed({
            balancePending: balance > 0,
            dueDate: balance > 0 ? dueDate : null,
            totalItems: subtotal,
            totalPaid: totalPaid
        });
    };

    return (
        <Card className="shadow-sm border-0" style={{ marginTop: '2px' }}>
            <CardBody className="d-flex flex-column">
                <h5 className="font-size-15 fw-bold text-dark mb-4">Resumo da Venda</h5>

                <div className="flex-grow-1">
                    {/* LISTA DE ITENS SELECIONADOS */}
                    <div className="mb-4">
                        <label className="text-muted font-size-12 fw-bold text-uppercase mb-2 d-block">Itens da venda</label>
                        {cartItems.length === 0 ? (
                            <div className="text-center py-3 border rounded border-light bg-light opacity-50 mb-3">
                                <span className="text-muted font-size-12 italic">Nenhum item selecionado</span>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2 mb-3">
                                {cartItems.map((item) => (
                                    <div key={item.cartId} className="p-2 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center animate__animated animate__fadeIn">
                                        <div>
                                            <span className="fw-bold text-dark font-size-13 d-block">{item.name}</span>
                                            <Badge color="light" className="text-muted font-size-10">{item.type}</Badge>
                                        </div>
                                        <div className="text-end d-flex align-items-center">
                                            <span className="fw-bold text-dark me-2">{formatCurrency(item.price || item.unitPrice)}</span>
                                            <Button color="link" size="sm" className="p-0 text-danger" onClick={() => onRemoveItem(item.cartId)}>
                                                <i className="mdi mdi-close-circle-outline font-size-16"></i>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* LISTA DE PAGAMENTOS */}
                    <div className="mb-4">
                        <label className="text-muted font-size-12 fw-bold text-uppercase mb-2 d-block">Pagamentos Realizados</label>
                        {payments.length === 0 ? (
                            <div className="text-center py-3 border rounded border-light bg-light opacity-50">
                                <span className="text-muted font-size-12 italic">Nenhum pagamento registrado</span>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {payments.map((p) => (
                                    <div key={p.id} className="p-2 border rounded bg-light-subtle d-flex justify-content-between align-items-center animate__animated animate__fadeIn">
                                        <div className="d-flex align-items-center">
                                            <i className={`mdi ${getMethodIcon(p.methodId)} text-primary me-2 font-size-18`}></i>
                                            <div>
                                                <span className="fw-bold text-dark font-size-13 d-block">{p.methodLabel}</span>
                                                <small className="text-muted">
                                                    {p.methodId.includes('cartao') ? `${p.brand} - ${p.installments}` : 'À vista'}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="text-end d-flex align-items-center">
                                            <span className="fw-bold text-success me-2">{formatCurrency(p.value)}</span>
                                            <Button color="link" size="sm" className="p-0 text-danger" onClick={() => onRemovePayment(p.id)}>
                                                <i className="mdi mdi-trash-can-outline font-size-16"></i>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CAMPO DE DATA PARA SALDO RESTANTE */}
                {balance > 0 && subtotal > 0 && (
                    <div className="mt-2 p-3 bg-light border rounded">
                        <label className="text-muted font-size-11 fw-bold text-uppercase mb-2 d-block">
                            Previsão para o Restante ({formatCurrency(balance)})
                        </label>
                        <InputGroup size="sm">
                            <InputGroupText className="bg-white border-end-0">
                                <i className="mdi mdi-calendar text-primary"></i>
                            </InputGroupText>
                            <Input
                                type="date"
                                className="border-start-0 ps-0"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                )}

                {/* RESUMO FINANCEIRO */}
                <div className="cart-summary mt-auto pt-3 border-top border-2">
                    <div className="d-flex justify-content-between mb-1 text-muted font-size-13">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1 text-muted font-size-13">
                        <span>Total Pago</span>
                        <span className="text-success fw-bold">{formatCurrency(totalPaid)}</span>
                    </div>

                    <div className={`d-flex justify-content-between mt-2 pt-2 border-top ${balance > 0 ? 'text-danger' : 'text-success'}`}>
                        <span className="fw-bold font-size-16">
                            {balance > 0 ? 'Saldo Restante' : 'Status'}
                        </span>
                        <span className="fw-bold font-size-18">
                            {balance > 0
                                ? formatCurrency(balance)
                                : 'QUITADO'
                            }
                        </span>
                    </div>

                    <Button
                        color="success"
                        size="lg"
                        block
                        className="w-100 fw-bold mt-4 py-2 shadow-sm text-uppercase"
                        onClick={handleFinalize}
                        disabled={subtotal === 0 || (balance > 0 && !dueDate)}
                    >
                        <i className="mdi mdi-check-circle-outline me-2"></i>
                        FINALIZAR VENDA
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

const getMethodIcon = (id) => {
    switch (id) {
        case PAYMENT_METHODS.CASH: return 'mdi-cash';
        case PAYMENT_METHODS.PIX: return 'mdi-qrcode';
        case PAYMENT_METHODS.DEBIT_CARD: return 'mdi-credit-card-check';
        case PAYMENT_METHODS.CREDIT_CARD: return 'mdi-credit-card';
        default: return 'mdi-currency-usd';
    }
}

export default SalesCartPanel;
