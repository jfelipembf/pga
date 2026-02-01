import { Card, CardBody, Row, Col } from 'reactstrap'
import { formatDate } from '../../../../utils/date'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { formatCurrency } from '../../../../utils/format'

const ClientSummary = ({ client }) => {
    const { summary } = useClientFinancial()
    const metrics = [
        {
            title: "Total Pago",
            value: summary ? formatCurrency(summary.totalPaid) : '...',
            icon: "mdi mdi-check-circle-outline",
            color: "success",
            bg: "soft-success"
        },
        {
            title: "Pendente",
            value: summary ? formatCurrency(summary.totalPending) : '...',
            icon: "mdi mdi-clock-outline",
            color: "warning",
            bg: "soft-warning"
        },
        {
            title: "Vencido",
            value: summary ? formatCurrency(summary.totalOverdue) : '...',
            icon: "mdi mdi-alert-circle-outline",
            color: "danger",
            bg: "soft-danger"
        },
        {
            title: "Total em Vendas",
            value: summary ? formatCurrency(summary.totalOwed) : '...',
            icon: "mdi mdi-cart-outline",
            color: "primary",
            bg: "soft-primary"
        }
    ]

    return (
        <div className="client-summary">
            <Row>
                {metrics.map((metric, idx) => (
                    <Col md={3} key={idx}>
                        <Card className="info-card">
                            <CardBody>
                                <div className={`info-card__icon bg-${metric.bg} text-${metric.color}`}>
                                    <i className={metric.icon} />
                                </div>
                                <p className="text-muted mb-1">{metric.title}</p>
                                <h4 className="mb-0">{metric.value}</h4>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mt-4">
                <Col lg={8}>
                    <div className="profile-section">
                        <div className="profile-section__title">
                            <i className="mdi mdi-account-details-outline" />
                            Informações Pessoais
                        </div>
                        <Row>
                            <Col md={6} className="mb-3">
                                <label className="text-muted font-size-12 mb-1">Nome Completo</label>
                                <div className="fw-medium">{client?.firstName} {client?.lastName}</div>
                            </Col>
                            <Col md={6} className="mb-3">
                                <label className="text-muted font-size-12 mb-1">E-mail</label>
                                <div className="fw-medium">{client?.email || 'Não informado'}</div>
                            </Col>
                            <Col md={6} className="mb-3">
                                <label className="text-muted font-size-12 mb-1">Telefone</label>
                                <div className="fw-medium">{client?.phone || 'Não informado'}</div>
                            </Col>
                            <Col md={6} className="mb-3">
                                <label className="text-muted font-size-12 mb-1">Data de Nascimento</label>
                                <div className="fw-medium">{client?.birthDate ? formatDate(client.birthDate) : 'Não informado'}</div>
                            </Col>
                            <Col md={12}>
                                <label className="text-muted font-size-12 mb-1">Observações de Saúde</label>
                                <div className="fw-medium">{client?.healthObservations || 'Nenhuma observação registrada.'}</div>
                            </Col>
                        </Row>
                    </div>
                </Col>
                <Col lg={4}>
                    <div className="profile-section h-100">
                        <div className="profile-section__title">
                            <i className="mdi mdi-history" />
                            Atividade Recente
                        </div>
                        <div className="text-center py-4">
                            <i className="mdi mdi-information-outline font-size-24 text-muted mb-2" />
                            <p className="text-muted mb-0">Nenhuma atividade recente registrada para este cliente.</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default ClientSummary
