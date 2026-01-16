import React, { useEffect, useState, useMemo } from "react"
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Badge,
    Input,
    Label
} from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { listAuditLogs } from "../../../services/Audit/audit.service"
import { listStaff } from "../../../services/Staff/staff.service"
import PageLoader from "../../../components/Common/PageLoader"
import BasicTable from "../../../components/Common/BasicTable"

const AuditLogPage = ({ setBreadcrumbItems }) => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState("")
    const [staffMap, setStaffMap] = useState({ byId: {}, byName: {} })

    useEffect(() => {
        const breadcrumbs = [
            { title: "Gerencial", link: "/#" },
            { title: "Logs de Auditoria", link: "/management/audit-log" },
        ]
        setBreadcrumbItems("Logs de Auditoria", breadcrumbs)
    }, [setBreadcrumbItems])

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [logsData, staffData] = await Promise.all([
                listAuditLogs({ date: selectedDate || null }),
                staffMap.byId.length ? null : listStaff() // only load staff once
            ])

            setLogs(logsData)

            if (staffData) {
                const map = { byId: {}, byName: {} }
                staffData.forEach(s => {
                    map.byId[s.id] = s
                    if (s.name) map.byName[s.name.toLowerCase()] = s
                    if (s.fullName) map.byName[s.fullName.toLowerCase()] = s
                    if (s.email) map.byName[s.email.toLowerCase()] = s
                })
                setStaffMap(map)
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }, [selectedDate, staffMap.byId.length])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Helpers to extract info from metadata
    // Helpers to extract info from metadata
    const getStaffInfo = (log) => {
        if (log.userId === "system") return { name: "SISTEMA", isSystem: true }
        // New format guarantees userName is populated in saveAuditLog or we trust userId lookup
        const name = log.userName || log.userId
        return { name, isSystem: false }
    }

    const getClientInfo = (log) => {
        const name = log.metadata?.clientName || log.metadata?.idClient || log.metadata?.idLead
        if (!name) return null
        return name
    }

    const columns = useMemo(() => [
        {
            label: "Data/Hora",
            key: "timestamp",
            render: (log) => (
                <span className="text-muted">
                    {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }).format(log.timestamp)}
                </span>
            )
        },
        {
            label: "Ação",
            key: "action",
            render: (log) => (
                <Badge color="primary" className="px-2 py-1 font-size-11" style={{ textTransform: 'uppercase', minWidth: '100px', display: 'inline-block', textAlign: 'center' }}>
                    {log.action?.replace(/_/g, " ")}
                </Badge>
            )
        },
        {
            label: "Descrição",
            key: "description",
            render: (log) => <span className="fw-medium text-dark">{log.description}</span>
        },
        {
            label: "Staff / Responsável",
            key: "staff",
            render: (log) => {
                const info = getStaffInfo(log)
                if (info.isSystem) {
                    return (
                        <Badge color="soft-secondary" className="font-size-11">
                            <i className="mdi mdi-robot me-1"></i> AUTOMÁTICO
                        </Badge>
                    )
                }

                // Try to find staff details
                // We rely on userId for staff identification in new format
                const staff = staffMap.byId[log.userId]
                const photo = staff?.photo

                return (
                    <div className="d-flex align-items-center">
                        <div className="avatar-xs me-2">
                            {photo ? (
                                <img src={photo} alt="" className="avatar-title rounded-circle font-size-12" style={{ objectFit: 'cover' }} />
                            ) : (
                                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-12">
                                    {info.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className="text-body">{staff?.name || info.name}</span>
                    </div>
                )
            }
        },
        {
            label: "Aluno / Alvo",
            key: "client",
            render: (log) => {
                const clientName = getClientInfo(log)
                if (!clientName) return <span className="text-muted small">-</span>

                // Check if target is actually a staff member
                const staff = staffMap.byName[clientName.toLowerCase()]

                if (staff) {
                    // Render as Staff
                    return (
                        <div className="d-flex align-items-center">
                            <div className="avatar-xs me-2" style={{ width: '24px', height: '24px' }}>
                                {staff.photo ? (
                                    <img src={staff.photo} alt="" className="avatar-title rounded-circle" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                ) : (
                                    <span className="avatar-title rounded-circle bg-soft-info text-info font-size-10">
                                        {staff.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-dark fw-medium small">{staff.name}</span>
                        </div>
                    )
                }

                // Render as Client (default)
                return (
                    <span className="text-info fw-semibold">
                        <i className="mdi mdi-account-circle me-1"></i>
                        {clientName}
                    </span>
                )
            }
        },
        {
            label: "ID",
            key: "id",
            render: (log) => <code className="bg-light px-2 py-1 rounded text-muted font-size-10">{log.targetId?.substring(0, 8)}...</code>
        }
    ], [staffMap])

    const dateFilterInput = (
        <div className="d-flex align-items-center gap-2">
            <Label className="mb-0 text-muted text-nowrap">Filtrar por data:</Label>
            <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ maxWidth: "160px" }}
                bsSize="sm"
            />
            {selectedDate && (
                <button
                    className="btn btn-link btn-sm text-muted p-0 text-decoration-none"
                    onClick={() => setSelectedDate("")}
                    title="Limpar filtro"
                >
                    <i className="mdi mdi-close"></i>
                </button>
            )}
        </div>
    )

    if (loading) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <Container fluid>
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <div className="d-flex align-items-center mb-4">
                                    <div className="flex-grow-1">
                                        <h4 className="card-title">Histórico de Operações</h4>
                                        <p className="card-title-desc">
                                            Acompanhe as ações críticas realizadas por usuários e processos automáticos.
                                        </p>
                                    </div>
                                </div>

                                <BasicTable
                                    columns={columns}
                                    data={logs}
                                    paginationPosition="bottom"
                                    hideSearch={true}
                                    hideNew={true}
                                    topContent={dateFilterInput}
                                    searchPlaceholder="Buscar logs..."
                                    wrapWithCard={false}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(AuditLogPage)
