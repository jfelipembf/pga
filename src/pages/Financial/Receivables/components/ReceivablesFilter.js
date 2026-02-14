import React, { useState } from 'react';
import { Card, CardBody, Row, Col, Label, Input, Button, Collapse } from 'reactstrap';


export const ReceivablesFilter = ({
    statusFilter, setStatusFilter,
    searchTerm, setSearchTerm,
    paymentFilter, setPaymentFilter,
    dateRange, setDateRange,
    onSearch,
    isLoading
}) => {
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

    return (
        <Card className="shadow-sm border-0">
            <CardBody>
                <Row className="g-3 align-items-end">
                    <Col md={3}>
                        <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Status</Label>
                        <Input type="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Todos os Status</option>
                            <option value="open">A Receber</option>
                            <option value="overdue">Atrasados</option>
                            <option value="paid">Recebidos</option>
                        </Input>
                    </Col>

                    <Col md={6}>
                        <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Pesquisa Rápida</Label>
                        <div className="search-box">
                            <div className="position-relative">
                                <Input
                                    type="text"
                                    className="form-control rounded"
                                    placeholder="Nome do cliente, número da venda ou descrição..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                                />
                                <i className="mdi mdi-magnify search-icon"></i>
                            </div>
                        </div>
                    </Col>

                    <Col md={3} className="d-flex gap-2">
                        <Button
                            color="primary"
                            className="w-100 py-2"
                            onClick={onSearch}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><i className="mdi mdi-loading mdi-spin me-1"></i> Buscando...</>
                            ) : (
                                <><i className="mdi mdi-filter-variant me-1"></i> PROCURAR</>
                            )}
                        </Button>
                        <Button
                            color="light"
                            className="py-2"
                            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                            active={moreFiltersOpen}
                            title="Filtros Avançados"
                        >
                            <i className={`mdi mdi-chevron-${moreFiltersOpen ? 'up' : 'down'}`}></i>
                        </Button>
                    </Col>
                </Row>

                <Collapse isOpen={moreFiltersOpen} className="mt-3">
                    <div className="bg-light p-3 rounded border border-light border-dashed">
                        <Row className="g-3">
                            <Col md={4}>
                                <Label className="font-size-11 fw-bold text-uppercase text-muted">Forma de Pagto</Label>
                                <Input type="select" bsSize="sm" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                                    <option value="all">Todas as Formas</option>
                                    <option value="credit_card">Cartão de Crédito</option>
                                    <option value="debit_card">Cartão de Débito</option>
                                    <option value="pix">PIX</option>
                                    <option value="money">Dinheiro</option>
                                    <option value="pending_payment">Crediário / Boleto</option>
                                </Input>
                            </Col>
                            <Col md={4}>
                                <Label className="font-size-11 fw-bold text-uppercase text-muted">Vencimento Início</Label>
                                <Input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dateRange.start instanceof Date ? dateRange.start.toISOString().split('T')[0] : dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </Col>
                            <Col md={4}>
                                <Label className="font-size-11 fw-bold text-uppercase text-muted">Vencimento Fim</Label>
                                <Input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dateRange.end instanceof Date ? dateRange.end.toISOString().split('T')[0] : dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </CardBody>
        </Card>
    );
};
