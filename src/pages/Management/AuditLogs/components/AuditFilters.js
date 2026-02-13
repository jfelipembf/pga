import React from 'react';
import { Row, Col, Card, CardBody, Label, Button, Collapse, Input } from 'reactstrap';
import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import { ENTITY_TYPES } from '../Constants';

const AuditFilters = ({
    filters,
    onFilterChange,
    searchTerm,
    onSearchChange,
    isFiltersOpen,
    toggleFilters
}) => {
    return (
        <Card className="shadow-sm border-0">
            <CardBody>
                <Row className="g-3 align-items-end">
                    <Col md={3}>
                        <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Entidade</Label>
                        <Input
                            type="select"
                            value={filters.entityType}
                            onChange={(e) => onFilterChange('entityType', e.target.value)}
                        >
                            {ENTITY_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </Input>
                    </Col>

                    <Col md={3}>
                        <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Gravidade</Label>
                        <Input
                            type="select"
                            value={filters.severity}
                            onChange={(e) => onFilterChange('severity', e.target.value)}
                        >
                            <option value="all">Todas</option>
                            <option value="INFO">Informação</option>
                            <option value="WARNING">Aviso</option>
                            <option value="CRITICAL">Crítico / Erro</option>
                        </Input>
                    </Col>

                    <Col md={4}>
                        <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Busca Rápida</Label>
                        <div className="position-relative">
                            <Input
                                type="text"
                                className="form-control"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <i className="mdi mdi-magnify position-absolute py-2 px-3" style={{ right: 0, top: 0 }}></i>
                        </div>
                    </Col>

                    <Col md={2} className="d-flex gap-2">
                        <Button
                            color="light"
                            className="w-100 py-2 border"
                            onClick={toggleFilters}
                            active={isFiltersOpen}
                        >
                            <i className={`mdi mdi-filter-variant me-1`}></i>
                            Datas
                        </Button>
                    </Col>
                </Row>

                <Collapse isOpen={isFiltersOpen} className="mt-3">
                    <div className="bg-light p-3 rounded border border-light border-dashed">
                        <Row className="g-3">
                            <Col md={6}>
                                <Label className="font-size-11 fw-bold text-uppercase text-muted">A partir de</Label>
                                <Flatpickr
                                    className="form-control"
                                    placeholder="Selecione data inicial"
                                    options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                                    onChange={([date]) => onFilterChange('startDate', date)}
                                />
                            </Col>
                            <Col md={6}>
                                <Label className="font-size-11 fw-bold text-uppercase text-muted">Até</Label>
                                <Flatpickr
                                    className="form-control"
                                    placeholder="Selecione data final"
                                    options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                                    onChange={([date]) => onFilterChange('endDate', date)}
                                />
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </CardBody>
        </Card>
    );
};

export default AuditFilters;
