import React, { useState } from 'react';
import { Card, CardBody, Row, Col, Label, Input, Button, Collapse } from 'reactstrap';
import { PAYABLE_STATUS, PAYABLE_STATUS_LABELS } from '../../../../utils/constants';

export const PayablesFilter = ({
    statusFilter, setStatusFilter,
    searchTerm, setSearchTerm,
    categoryFilter, setCategoryFilter,
    dateRange, setDateRange, // dateRange = { start, end }
    categories = [],
    isLoading
}) => {
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

    return (
        <Card className="shadow-sm border-0">
            <CardBody>
                <div className="d-flex flex-wrap gap-3 mb-4 bg-light p-3 rounded align-items-end">
                    <div className="flex-grow-1">
                        <Label className="form-label font-size-13 text-muted fw-bold">BUSCAR</Label>
                        <div className="position-relative">
                            <Input
                                type="text"
                                placeholder="Buscar por descrição, fornecedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '35px' }}
                            />
                            <i className="mdi mdi-magnify position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}></i>
                        </div>
                    </div>

                    <div style={{ minWidth: '150px' }}>
                        <Label className="form-label font-size-13 text-muted fw-bold">STATUS</Label>
                        <Input type="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value={PAYABLE_STATUS.OPEN}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.OPEN]}</option>
                            <option value={PAYABLE_STATUS.PAID}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.PAID]}</option>
                            <option value={PAYABLE_STATUS.OVERDUE}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.OVERDUE]}</option>
                        </Input>
                    </div>

                    <div>
                        <Label className="d-block">&nbsp;</Label>
                        <Button
                            color="secondary"
                            outline
                            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                            active={moreFiltersOpen}
                        >
                            <i className="mdi mdi-filter-variant me-1"></i> {moreFiltersOpen ? 'Ocultar Filtros' : 'Mais Filtros'}
                        </Button>
                    </div>
                </div>

                <Collapse isOpen={moreFiltersOpen} className="mb-4">
                    <div className="bg-light p-3 rounded border border-light border-dashed">
                        <Row className="g-3">
                            <Col md={3}>
                                <Label className="font-size-11 fw-bold text-uppercase">Categoria</Label>
                                <Input type="select" bsSize="sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                    <option value="all">Todas as Categorias</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </Input>
                            </Col>
                            <Col md={3}>
                                <Label className="font-size-11 fw-bold text-uppercase">Início (Vencimento)</Label>
                                <Input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dateRange.start instanceof Date ? dateRange.start.toISOString().split('T')[0] : dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </Col>
                            <Col md={3}>
                                <Label className="font-size-11 fw-bold text-uppercase">Fim (Vencimento)</Label>
                                <Input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dateRange.end instanceof Date ? dateRange.end.toISOString().split('T')[0] : dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Button color="link" size="sm" className="text-danger p-0 fw-bold" onClick={() => {
                                    setCategoryFilter('all');
                                    setDateRange({ start: '', end: '' });
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}>
                                    Limpar Tudo
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </CardBody>
        </Card>
    );
};
