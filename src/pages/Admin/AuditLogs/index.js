import React, { useState } from "react"
import {
    Row, Col, Card, CardBody,
    Label, Button, Collapse, Input
} from "reactstrap"
import BasicTable from "../../../components/Common/BasicTable"
import { useAuditLogs } from "./hooks/useAuditLogs"
import { formatDate } from "../../../utils/date"
import AuditLogDetailsModal from "./AuditLogDetailsModal"
import Flatpickr from "react-flatpickr"
import { Portuguese } from "flatpickr/dist/l10n/pt.js"
import "flatpickr/dist/themes/material_blue.css"
import PageLoader from "../../../components/Common/PageLoader"

const AuditLogsPage = () => {
    document.title = "Logs de Auditoria | Lexa Admin"

    const {
        logs,
        loading,
        staff,
        filters,
        setFilters
    } = useAuditLogs()

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const toggleModal = () => setModalOpen(!modalOpen)
    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen)

    const viewDetails = (log) => {
        setSelectedLog(log)
        setModalOpen(true)
    }

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const getActionBadge = (action, severity) => {
        const actionUpper = String(action || '').toUpperCase();
        let color = "secondary";
        let icon = "circle-outline";

        if (severity === 'CRITICAL') { color = "danger"; icon = "alert-octagon"; }
        else if (actionUpper.includes('CREATE')) { color = "success"; icon = "plus-circle-outline"; }
        else if (actionUpper.includes('DELETE')) { color = "danger"; icon = "delete-outline"; }
        else if (actionUpper.includes('UPDATE')) { color = "warning"; icon = "pencil-outline"; }
        else if (actionUpper.includes('CANCEL')) { color = "danger"; icon = "close-circle-outline"; }
        else if (actionUpper.includes('PAID') || actionUpper.includes('SUCCESS') || actionUpper.includes('SETTLED')) { color = "success"; icon = "check-all"; }
        else if (actionUpper.includes('INCOME')) { color = "success"; icon = "arrow-down-circle-outline"; }
        else if (actionUpper.includes('EXPENSE')) { color = "danger"; icon = "arrow-up-circle-outline"; }

        return (
            <span className={`badge badge-soft-${color} font-size-12 fw-bold px-2 py-1`}>
                <i className={`mdi mdi-${icon} me-1`}></i>
                {action}
            </span>
        );
    };

    const columns = [
        {
            label: "Horário",
            key: "timestamp",
            render: (log) => (
                <div className="text-nowrap">
                    <span className="fw-medium d-block text-dark">{formatDate(log.timestamp, 'time')}</span>
                    <small className="text-muted font-size-11">{formatDate(log.timestamp, 'short')}</small>
                </div>
            )
        },
        {
            label: "Usuário",
            key: "userId",
            render: (log) => {
                const staffMember = staff[log.userId];
                const name = staffMember?.name || log.userName || log.userId || 'Usuário Desconhecido';
                const photo = staffMember?.photo;

                return (
                    <div className="d-flex align-items-center">
                        <div className="avatar-xs me-2">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt={name}
                                    className="avatar-title rounded-circle"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                            ) : (
                                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-11">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="d-block text-truncate fw-medium" style={{ maxWidth: '140px' }}>
                                {name}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            label: "Ação",
            key: "action",
            render: (log) => getActionBadge(log.action, log.severity)
        },
        {
            label: "Entidade",
            key: "entityType",
            render: (log) => (
                <span className="badge bg-light text-muted border text-uppercase font-size-10">
                    {log.entityType}
                </span>
            )
        },
        {
            label: "Descrição",
            key: "description",
            render: (log) => (
                <div className="font-size-13 text-muted" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                    {log.description}
                </div>
            )
        },
        {
            label: "",
            key: "actions",
            render: (log) => (
                <div className="text-end">
                    <Button
                        color="light"
                        size="sm"
                        onClick={() => viewDetails(log)}
                    >
                        <i className="mdi mdi-eye-outline text-primary font-size-14"></i>
                    </Button>
                </div>
            )
        }
    ]

    const entityTypes = [
        { id: 'all', label: 'Todos os Recursos' },
        { id: 'sale', label: 'Vendas' },
        { id: 'receivable', label: 'Recebíveis' },
        { id: 'payable', label: 'Contas a Pagar' },
        { id: 'bankAccount', label: 'Contas Bancárias' },
        { id: 'cashier', label: 'Caixa' },
        { id: 'client', label: 'Clientes' },
        { id: 'plan', label: 'Planos/Contratos' },
        { id: 'technical_log', label: 'Logs Técnicos (Erros)' }
    ]

    if (loading && !logs.length) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="font-size-18 text-uppercase fw-bold">Trilha de Auditoria</h4>
            </div>

            <Card className="shadow-sm border-0">
                <CardBody>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Entidade</Label>
                            <Input
                                type="select"
                                value={filters.entityType}
                                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                            >
                                {entityTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </Input>
                        </Col>

                        <Col md={3}>
                            <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Gravidade</Label>
                            <Input
                                type="select"
                                value={filters.severity}
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
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
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                {isFiltersOpen ? "Datas" : "Datas"}
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
                                        onChange={([date]) => handleFilterChange('startDate', date)}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label className="font-size-11 fw-bold text-uppercase text-muted">Até</Label>
                                    <Flatpickr
                                        className="form-control"
                                        placeholder="Selecione data final"
                                        options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                                        onChange={([date]) => handleFilterChange('endDate', date)}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Collapse>
                </CardBody>
            </Card>

            <BasicTable
                columns={columns}
                data={logs}
                loading={loading}
                isSearchable={true}
                hideSearch={true}
                externalSearch={searchTerm}
                onExternalSearchChange={setSearchTerm}
                wrapWithCard={true}
                pagination={{
                    enabled: true,
                    pageSize: 15
                }}
            />

            <AuditLogDetailsModal
                isOpen={modalOpen}
                toggle={toggleModal}
                log={selectedLog}
                userName={selectedLog ? (staff[selectedLog.userId]?.name || selectedLog.userName || selectedLog.userId || 'Usuário Desconhecido') : ''}
            />
        </React.Fragment>
    )
}

export default AuditLogsPage
