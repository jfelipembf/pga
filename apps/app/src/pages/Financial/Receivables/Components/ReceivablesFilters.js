import React from "react"
import { Button, Col, Input, Row } from "reactstrap"
import ClientAddSearch from "../../../../components/Common/ClientAddSearch"
import { RECEIVABLE_STATUS, RECEIVABLE_STATUS_LABELS } from "../Constants/receivablesConstants"

const ReceivablesFilters = ({
    filters,
    onUpdate,
    onSearch, // New: Trigger search
    onClear = () => { }, // New: Clear filters
    // Search Props
    clientSearchText = "",
    setClientSearchText = () => { },
    clientCandidates = [],
    selectedClient = null,
    handleSelectClient = () => { },
    handleClearClient = () => { }
}) => {
    return (
        <Row className="g-3 mb-4">
            {/* Date Range - Start */}
            <Col md={2}>
                <label className="form-label small text-muted">Data Inicial (Venc.)</label>
                <Input
                    type="date"
                    value={filters.startDate}
                    onChange={e => onUpdate("startDate", e.target.value)}
                />
            </Col>

            {/* Date Range - End */}
            <Col md={2}>
                <label className="form-label small text-muted">Data Final (Venc.)</label>
                <Input
                    type="date"
                    value={filters.endDate}
                    onChange={e => onUpdate("endDate", e.target.value)}
                />
            </Col>

            {/* Status Filter */}
            <Col md={2}>
                <label className="form-label small text-muted">Status</label>
                <Input
                    type="select"
                    value={filters.status}
                    onChange={e => onUpdate("status", e.target.value)}
                >
                    <option value="">Todos</option>
                    {Object.values(RECEIVABLE_STATUS).map(status => (
                        <option key={status} value={status}>
                            {RECEIVABLE_STATUS_LABELS[status]}
                        </option>
                    ))}
                </Input>
            </Col>

            {/* Client Search */}
            <Col md={4}>
                <label className="form-label small text-muted">Aluno</label>
                {!selectedClient ? (
                    <ClientAddSearch
                        value={clientSearchText}
                        onChange={setClientSearchText}
                        candidates={clientCandidates}
                        onSelect={handleSelectClient}
                        placeholder="Nome do aluno..."
                        showNoResults={clientSearchText.length > 2 && clientCandidates.length === 0}
                    />
                ) : (
                    <div className="input-group">
                        <div className="form-control bg-light d-flex align-items-center justify-content-between">
                            <span className="text-truncate fw-medium text-primary">
                                <i className="mdi mdi-account-check me-2"></i>
                                {selectedClient.name}
                            </span>
                        </div>
                        <Button color="danger" outline onClick={handleClearClient}>
                            <i className="mdi mdi-close"></i>
                        </Button>
                    </div>
                )}
            </Col>

            {/* Search Button */}
            <Col md={2} className="d-flex align-items-end gap-2">
                <Button
                    color="primary"
                    className="flex-grow-1"
                    onClick={onSearch} // Trigger fetch
                >
                    <i className="bx bx-search-alt-2 me-1"></i> Buscar
                </Button>
                <Button
                    color="light"
                    className="flex-grow-1"
                    onClick={onClear}
                    title="Limpar filtros"
                >
                    <i className="mdi mdi-eraser me-1"></i> Limpar
                </Button>
            </Col>
        </Row>
    )
}

export default ReceivablesFilters
