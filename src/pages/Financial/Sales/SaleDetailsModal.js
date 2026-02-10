import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Row, Col } from 'reactstrap';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import { formatId } from '../../../utils/sequence';
import StatusBadge from '../../../components/Common/StatusBadge';
import { PAYMENT_METHOD_LABELS } from '../../../utils/constants';

const SaleDetailsModal = ({ isOpen, toggle, sale, receivables = [] }) => {
    if (!sale) return null;

    const getMethodLabel = (id) => PAYMENT_METHOD_LABELS[id] || id || '-';

    // Lógica para Saldo Devedor Real (Fonte Única de Verdade)
    const saleReceivables = receivables.filter(r =>
        r.idSale === sale.id &&
        (r.type === 'client' || r.paymentMethod === 'pending_payment')
    );

    const liveBalance = saleReceivables.reduce((sum, r) =>
        sum + (r.status === 'open' ? (parseFloat(r.pending) || 0) : 0), 0
    );

    const liveStatus = liveBalance > 0.01 ? 'partial' : 'paid';

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
                Detalhes da Venda {sale.saleNumber ? formatId(sale.saleNumber) : ''}
            </ModalHeader>
            <ModalBody className="p-4">
                {/* Header Info */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h5 className="mb-1 fw-bold text-primary">{sale.clientName}</h5>
                        <p className="text-muted mb-0">
                            <i className="mdi mdi-calendar me-1"></i> {formatDate(sale.saleDate)}
                        </p>
                    </div>
                    <div className="text-end">
                        <StatusBadge status={liveStatus} />
                    </div>
                </div>

                {/* Items Table */}
                <h6 className="fw-bold text-uppercase font-size-12 mb-2">Itens da Venda</h6>
                <div className="table-responsive mb-4">
                    <Table className="table-nowrap align-middle table-hover border">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '70px' }}>Qtd</th>
                                <th>Descrição</th>
                                <th className="text-end">Unitário</th>
                                <th className="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.quantity} {item.unit || 'un'}</td>
                                    <td>
                                        <div className="fw-medium">{item.name}</div>
                                        {item.description && <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>{item.description}</small>}
                                    </td>
                                    <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                    <td className="text-end fw-bold">{formatCurrency(item.total || (item.quantity * item.unitPrice))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <Row className="justify-content-end">
                    <Col md={5}>
                        <div className="bg-light p-3 rounded border">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal || sale.total + (sale.discount || 0))}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-danger">
                                    <span>Desconto</span>
                                    <span>- {formatCurrency(sale.discount)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-2 font-size-16 text-dark">
                                <span>Total da Venda</span>
                                <span>{formatCurrency(sale.total)}</span>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Payment Methods */}
                {(sale.payments?.length > 0 || liveBalance > 0) && (
                    <div className="mt-4">
                        <h6 className="fw-bold text-uppercase font-size-12 mb-2">Formas de Liquidação / Pagamento</h6>
                        <div className="bg-light p-3 rounded border">
                            {sale.payments?.map((payment, index) => (
                                <div key={index} className="mb-3 last-child-mb-0">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <div>
                                            <i className="mdi mdi-check-circle text-success me-2"></i>
                                            <span className="fw-bold">{getMethodLabel(payment.methodId)}</span>
                                        </div>
                                        <span className="fw-bold text-success font-size-15">{formatCurrency(payment.value)}</span>
                                    </div>

                                    {/* Detalhes do Cartão (Bandeira, Auth, Parcelas) */}
                                    {['credit_card', 'debit_card'].includes(payment.methodId) && (
                                        <div className="ms-4 ps-1">
                                            <div className="d-flex gap-3 text-muted font-size-12">
                                                {payment.brand && (
                                                    <span>
                                                        <i className="mdi mdi-card-bulleted-outline me-1"></i>
                                                        Bandeira: <strong>{payment.brand.toUpperCase()}</strong>
                                                    </span>
                                                )}
                                                {payment.auth && (
                                                    <span>
                                                        <i className="mdi mdi-lock-check-outline me-1"></i>
                                                        Autorização: <strong>{payment.auth}</strong>
                                                    </span>
                                                )}
                                                {payment.installments > 1 && (
                                                    <span>
                                                        <i className="mdi mdi-layers-outline me-1"></i>
                                                        Parcelamento: <strong>{payment.installments}x</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {liveBalance > 0 && (
                                <div className="d-flex justify-content-between align-items-center mb-1 text-warning border-top pt-2 mt-2">
                                    <div>
                                        <i className="mdi mdi-clock-outline me-2"></i>
                                        <span className="fw-medium">Saldo Devedor (Aberto com o Cliente)</span>
                                    </div>
                                    <span className="fw-bold">{formatCurrency(liveBalance)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {sale.notes && (
                    <div className="mt-4">
                        <h6 className="fw-bold text-uppercase font-size-12 mb-1">Observações</h6>
                        <div className="p-3 bg-light rounded italic text-muted font-size-13 border">
                            "{sale.notes}"
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Fechar</Button>
                <Button color="primary" outline>
                    <i className="mdi mdi-printer me-1"></i> Imprimir Recibo
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SaleDetailsModal;
