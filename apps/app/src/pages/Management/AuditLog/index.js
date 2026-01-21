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
import { listClients } from "../../../services/Clients/clients.service"
import PageLoader from "../../../components/Common/PageLoader"
import BasicTable from "../../../components/Common/BasicTable"

const AuditLogPage = ({ setBreadcrumbItems }) => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState("")
    const [staffMap, setStaffMap] = useState({ byId: {}, byName: {} })
    const [clientMap, setClientMap] = useState({ byId: {}, byIdGym: {} })

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
            const shouldLoadStaff = Object.keys(staffMap.byId).length === 0
            const shouldLoadClients = Object.keys(clientMap.byId).length === 0
            
            const [logsData, staffData, clientData] = await Promise.all([
                listAuditLogs({ date: selectedDate || null }),
                shouldLoadStaff ? listStaff() : null,
                shouldLoadClients ? listClients() : null
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

            if (clientData) {
                const map = { byId: {}, byIdGym: {} }
                clientData.forEach(c => {
                    map.byId[c.id] = c
                    if (c.idGym) map.byIdGym[c.idGym] = c
                })
                setClientMap(map)
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }, [selectedDate, staffMap.byId, clientMap.byId])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Helpers to extract info from metadata
    // Helpers to extract info from metadata
    const getStaffInfo = React.useCallback((log) => {
        if (log.userId === "system") return { name: "SISTEMA", isSystem: true }
        
        // 1. Try to find in StaffMap (Best source, has photo & full details)
        // Check all possible ID locations: userId (standard), actor.uid (snapshot), or legacy uid
        const possibleIds = [log.userId, log.actor?.uid, log.uid].filter(Boolean)
        let staff = null
        
        for (const id of possibleIds) {
            if (staffMap.byId[id]) {
                staff = staffMap.byId[id]
                break
            }
        }

        if (staff) {
            return {
                name: staff.name || staff.fullName || staff.displayName,
                email: staff.email,
                photo: staff.photo,
                isSystem: false,
                found: true
            }
        }

        // 2. Fallback to Snapshot data stored in the log (Actor object)
        if (log.actor && log.actor.name && log.actor.name !== "Unknown") {
            return {
                name: log.actor.name,
                email: log.actor.email,
                photo: null,
                isSystem: false,
                found: false
            }
        }

        // 3. Fallback to flat fields
        const name = log.userName || (possibleIds[0] ? `UID: ${possibleIds[0]}` : "Desconhecido")
        return { 
            name, 
            email: null, 
            photo: null, 
            isSystem: false,
            found: false 
        }
    }, [staffMap.byId])

    const getTargetInfo = React.useCallback((log) => {
        // 1. New Pattern (target object)
        if (log.target && log.target.name && log.target.name !== "Unknown") {
            return {
                name: log.target.name,
                idGym: log.target.idGym || log.target.metadata?.idGym,
                type: log.target.type,
                id: log.target.id
            }
        }

        // 2. Old Pattern (metadata key)
        const metaClientName = log.metadata?.clientName
        const metaClientId = log.metadata?.idClient
        const metaIdGym = log.metadata?.idGym
        
        // Try to enrich with client data from clientMap
        if (metaClientId && clientMap.byId[metaClientId]) {
            const client = clientMap.byId[metaClientId]
            return {
                name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || metaClientName || metaClientId,
                idGym: client.idGym || metaIdGym,
                type: 'client',
                id: metaClientId
            }
        }
        
        if (metaIdGym && clientMap.byIdGym[metaIdGym]) {
            const client = clientMap.byIdGym[metaIdGym]
            return {
                name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || metaClientName,
                idGym: metaIdGym,
                type: 'client',
                id: client.id
            }
        }
        
        // Fallback to metadata values
        if (metaClientName || metaClientId || log.metadata?.idLead) {
            return { 
                name: metaClientName || metaClientId || log.metadata?.idLead, 
                idGym: metaIdGym, 
                type: 'client' 
            }
        }

        return null
    }, [clientMap.byId, clientMap.byIdGym])

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

                const displayName = info.name
                const photo = info.photo
                const isUid = displayName.startsWith("UID:")
                const displayLabel = isUid ? displayName.substring(0, 12) + "..." : displayName

                return (
                    <div className="d-flex align-items-center">
                        <div className="avatar-xs me-2">
                            {photo ? (
                                <img src={photo} alt="" className="avatar-title rounded-circle font-size-12" style={{ objectFit: 'cover', width: '24px', height: '24px' }} />
                            ) : (
                                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-12">
                                    {(displayName || "?").charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="d-flex flex-column">
                            <span className="text-body fw-medium" title={isUid ? displayName : ''}>
                                {displayLabel}
                            </span>
                            {info.email && (
                                <small className="text-muted font-size-10">{info.email}</small>
                            )}
                        </div>
                    </div>
                )
            }
        },
        {
            label: "Aluno / Alvo",
            key: "client",
            render: (log) => {
                const target = getTargetInfo(log);

                if (!target) return <span className="text-muted small">-</span>

                return (
                    <div className="d-flex flex-column">
                        <span className="text-info fw-semibold">
                            <i className="mdi mdi-account-circle me-1"></i>
                            {target.name}
                        </span>
                        {target.idGym && (
                            <small className="text-muted ms-3">ID: {target.idGym}</small>
                        )}
                    </div>
                )
            }
        },
        {
            label: "ID",
            key: "id",
            render: (log) => <code className="bg-light px-2 py-1 rounded text-muted font-size-10">{log.targetId?.substring(0, 8)}...</code>
        }
    ], [getStaffInfo, getTargetInfo])

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
