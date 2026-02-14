import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge } from 'reactstrap';
import { formatDate } from '../../../../utils/date';
import { formatCurrency } from '../../../../utils/format';
import { PAYMENT_METHOD_LABELS } from '../../../../utils/constants';
const getMethodLabel = (id) => PAYMENT_METHOD_LABELS[id] || id || '-';

const ReceivableDetailsModal = ({ isOpen, toggle, receivable }) => {
    if (!receivable) return null;

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="md">
            <ModalHeader toggle={toggle}>
                Detalhes do Título
            </ModalHeader>
            <ModalBody className="p-4">
                <div className="text-center mb-4">
                    <h5 className="mb-0 text-primary fw-bold text-uppercase">{receivable.clientName}</h5>
                    <p className="text-muted font-size-12">
                        ID: {receivable.clientGymId || receivable.idGym || receivable.friendlyId || receivable.idClient?.substring(0, 8)} |
                        Referente à Venda #{receivable.saleNumber || receivable.idSale}
                    </p>
                </div>

                <div className="bg-light p-3 rounded border mb-3">
                    <Row className="mb-2">
                        <Col xs={6} className="text-muted">Vencimento</Col>
                        <Col xs={6} className="text-end fw-bold">{formatDate(receivable.dueDate)}</Col>
                    </Row>
                    <Row className="mb-2">
                        <Col xs={6} className="text-muted">Valor Bruto</Col>
                        <Col xs={6} className="text-end fw-medium">{formatCurrency(receivable.amount)}</Col>
                    </Row>

                    {receivable.feeAmount > 0 && (
                        <Row className="mb-2">
                            <Col xs={6} className="text-danger font-size-12">(-) Taxas Adm.</Col>
                            <Col xs={6} className="text-end text-danger font-size-12">- {formatCurrency(receivable.feeAmount)}</Col>
                        </Row>
                    )}

                    <Row className="mb-2 border-top pt-2 mt-2">
                        <Col xs={6} className="text-dark fw-bold">Líquido Previsto</Col>
                        <Col xs={6} className="text-end fw-bold text-dark">{formatCurrency(receivable.netAmount || receivable.amount)}</Col>
                    </Row>
                    <Row className="mb-2">
                        <Col xs={6} className="text-muted">Forma de Pagto</Col>
                        <Col xs={6} className="text-end fw-medium">{getMethodLabel(receivable.paymentMethod)}</Col>
                    </Row>
                    <hr className="my-2" />
                    <Row>
                        <Col xs={6} className="text-muted align-self-center">Status</Col>
                        <Col xs={6} className="text-end">
                            <Badge color={receivable.status === 'paid' ? 'success' : (receivable.isOverdue ? 'danger' : 'warning')} className="p-2 font-size-12">
                                {(receivable.status === 'paid' ? 'RECEBIDO' : (receivable.isOverdue ? 'ATRASADO' : 'EM ABERTO'))}
                            </Badge>
                        </Col>
                    </Row>
                </div>

                {receivable.status === 'paid' && (
                    <div className="bg-success bg-soft p-3 rounded border border-success">
                        <h6 className="text-success fw-bold border-bottom border-success pb-2 mb-2">Dados da Baixa</h6>
                        <Row className="mb-2">
                            <Col xs={6} className="text-success-50">Data Recebimento</Col>
                            <Col xs={6} className="text-end fw-bold text-success">{formatDate(receivable.settlementDate)}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={6} className="text-success-50">Valor Recebido</Col>
                            <Col xs={6} className="text-end fw-bold text-success font-size-16">{formatCurrency(receivable.amountReceived)}</Col>
                        </Row>
                        {receivable.notes && (
                            <div className="mt-2 text-success-50 font-size-12 fst-italic">
                                "{receivable.notes}"
                            </div>
                        )}
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Fechar</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ReceivableDetailsModal;
