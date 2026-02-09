import { Card, CardBody, Row, Col, Badge, Table } from 'reactstrap'
import { formatDate } from '../../../../utils/date'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { useClientEnrollments } from '../hooks/useClientEnrollments'
import { formatCurrency } from '../../../../utils/format'
import StatusBadge from '../../../../components/Common/StatusBadge'
import ClientAttendanceMetrics from './ClientAttendanceMetrics'

const ClientSummary = ({ client }) => {
    const { summary, contracts } = useClientFinancial()
    const { enrollments } = useClientEnrollments(client?.id)

    const activeContracts = contracts?.filter(c => ['active', 'suspended'].includes(c.status)) || []

    const metrics = [
        {
            title: "Total Pago",
            value: summary ? formatCurrency(summary.totalPaid) : '...',
            icon: "mdi mdi-check-all",
            color: "success"
        },
        {
            title: "Pendente",
            value: summary ? formatCurrency(summary.totalPending) : '...',
            icon: "mdi mdi-clock-outline",
            color: "warning"
        },
        {
            title: "Vencido",
            value: summary ? formatCurrency(summary.totalOverdue) : '...',
            icon: "mdi mdi-alert-circle-outline",
            color: "danger"
        },
        {
            title: "Total em Vendas",
            value: summary ? formatCurrency(summary.totalOwed) : '...',
            icon: "mdi mdi-cart-arrow-down",
            color: "primary"
        }
    ]

    return (
        <div className="client-summary animate__animated animate__fadeIn">
            {/* Métricas Financeiras Rápidas */}
            <Row>
                {metrics.map((metric, idx) => (
                    <Col md={3} sm={6} key={idx} className="mb-4">
                        <Card className="border-0 shadow-sm h-100 mb-0">
                            <CardBody className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className={`avatar-sm me-3`}>
                                        <span className={`avatar-title rounded-circle bg-soft-${metric.color} text-${metric.color} font-size-20`}>
                                            <i className={metric.icon}></i>
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-muted mb-1 font-size-13 fw-medium">{metric.title}</p>
                                        <h4 className="mb-0 fw-bold">{metric.value}</h4>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row>
                {/* Coluna da Esquerda: Contratos e Atividade */}
                <Col lg={7}>
                    {/* Resumo de Presença e Risco (histórico completo) */}
                    <ClientAttendanceMetrics enrollments={enrollments} />

                    <Card className="border-0 shadow-sm mb-4">
                        <CardBody>
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                                    <i className="mdi mdi-file-certificate-outline text-primary me-2 font-size-20" />
                                    Matrículas em Vigência
                                </h5>
                                <Badge color="soft-primary" className="rounded-pill px-3">{activeContracts.length} Ativas</Badge>
                            </div>

                            {activeContracts.length > 0 ? (
                                <div className="table-responsive">
                                    <Table className="table-borderless table-centered align-middle table-nowrap mb-0">
                                        <thead className="text-muted table-light font-size-11 text-uppercase letter-spacing-1">
                                            <tr>
                                                <th>Plano</th>
                                                <th>Vigência</th>
                                                <th>Status</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeContracts.map((contract) => (
                                                <tr key={contract.id}>
                                                    <td>
                                                        <h6 className="font-size-13 mb-1 text-dark fw-bold">{contract.planName}</h6>
                                                        <span className="text-muted font-size-11">{contract.friendlyId}</span>
                                                    </td>
                                                    <td>
                                                        <div className="font-size-12">
                                                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                                        </div>
                                                    </td>
                                                    <td><StatusBadge status={contract.status} /></td>
                                                    <td><span className="fw-bold text-primary">{formatCurrency(contract.value)}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-5 bg-light rounded shadow-inner border border-dashed">
                                    <i className="mdi mdi-file-question-outline font-size-32 text-muted mb-2"></i>
                                    <p className="text-muted mb-0">Nenhuma matrícula ativa encontrada.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardBody>
                            <h5 className="card-title mb-4 fw-bold">
                                <i className="mdi mdi-shield-plus-outline text-warning me-2 font-size-20" />
                                Saúde e Restrições
                            </h5>
                            <div className={`p-3 rounded border-start border-4 ${client?.healthObservations ? 'bg-soft-warning border-warning' : 'bg-soft-info border-info'}`}>
                                <h6 className="font-size-14 mb-2 text-dark fw-bold">Observações Médicas</h6>
                                <p className="mb-0 text-muted font-size-13 lh-base">
                                    {client?.healthObservations || "O aluno não informou nenhuma restrição médica ou observação de saúde relevante."}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Coluna da Direita: Dados Pessoais rápidos */}
                <Col lg={5}>
                    <Card className="border-0 shadow-sm h-100">
                        <CardBody>
                            <h5 className="card-title mb-4 fw-bold border-bottom pb-3 d-flex align-items-center">
                                <i className="mdi mdi-account-circle-outline text-primary me-2 font-size-22" />
                                Visão Geral do Aluno
                            </h5>

                            <div className="mb-4">
                                <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold letter-spacing-1">Contato e Identificação</p>
                                <div className="d-flex flex-column gap-3 mt-2">
                                    <div className="d-flex align-items-start">
                                        <i className="mdi mdi-email-outline text-muted font-size-18 me-3 mt-1" />
                                        <div>
                                            <span className="text-muted font-size-11 d-block">E-mail</span>
                                            <span className="fw-medium text-dark">{client?.email || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-start">
                                        <i className="mdi mdi-phone-outline text-muted font-size-18 me-3 mt-1" />
                                        <div>
                                            <span className="text-muted font-size-11 d-block">Telefone Principal</span>
                                            <span className="fw-medium text-dark">{client?.phone || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-start">
                                        <i className="mdi mdi-identifier text-muted font-size-18 me-3 mt-1" />
                                        <div>
                                            <span className="text-muted font-size-11 d-block">CPF</span>
                                            <span className="fw-medium text-dark">{client?.cpf || 'Não informado'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold letter-spacing-1">Localização</p>
                                <div className="mt-2 d-flex align-items-start">
                                    <i className="mdi mdi-map-marker-outline text-danger font-size-18 me-3 mt-1" />
                                    <div>
                                        <span className="text-muted font-size-11 d-block">Endereço Residencial</span>
                                        <span className="fw-medium text-dark lh-base">
                                            {client?.address?.street ? (
                                                `${client.address.street}, ${client.address.number}`
                                            ) : 'Endereço não cadastrado'}
                                            {client?.address?.complement && <span className="text-muted d-block small">({client.address.complement})</span>}
                                            {client?.address?.city && <span className="text-muted d-block small">{client.address.neighborhood} - {client.address.city}/{client.address.state}</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-top pt-3">
                                <p className="text-muted mb-2 font-size-11 text-uppercase fw-bold letter-spacing-1">Emergência</p>
                                <div className="p-3 bg-light rounded d-flex align-items-center border border-dashed border-danger-subtle">
                                    <div className="avatar-xs me-3">
                                        <span className="avatar-title rounded-sm bg-soft-danger text-danger">
                                            <i className="mdi mdi-phone-alert"></i>
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                        <h6 className="font-size-13 text-truncate mb-1 fw-bold text-dark">{client?.emergencyContact?.name || 'Não informado'}</h6>
                                        <p className="text-muted text-truncate mb-0 font-size-12">{client?.emergencyContact?.phone || 'Sem telefone'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default ClientSummary
