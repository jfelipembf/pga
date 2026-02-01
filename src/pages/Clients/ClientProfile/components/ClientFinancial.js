import React from 'react'
import { Row, Col, Card, CardBody, Table, Badge, Button, Spinner } from 'reactstrap'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { formatCurrency } from '../../../../utils/format'
import { formatDate } from '../../../../utils/date'
import { formatSaleNumber, generateShortCode } from '../../../../utils/idGenerators'
import StatusBadge from '../../../../components/Common/StatusBadge'

const ClientFinancial = () => {
    const { summary, receivables, sales, loading } = useClientFinancial()

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner />
                <p className="text-muted mt-2">Carregando dados financeiros...</p>
            </div>
        )
    }

    const cards = [
        { title: "Total em Vendas", value: summary.totalOwed, icon: "mdi mdi-cart-outline", color: "primary" },
        { title: "Total Pago", value: summary.totalPaid, icon: "mdi mdi-check-circle-outline", color: "success" },
        { title: "Pendente", value: summary.totalPending, icon: "mdi mdi-clock-outline", color: "warning" },
        { title: "Vencido", value: summary.totalOverdue, icon: "mdi mdi-alert-circle-outline", color: "danger" }
    ]

    return (
        <div className="client-financial">
            {/* Cards de Resumo */}
            <Row>
                {cards.map((card, idx) => (
                    <Col md={3} key={idx}>
                        <Card className="info-card">
                            <CardBody>
                                <div className="d-flex align-items-center mb-3">
                                    <div className={`avatar-xs me-3`}>
                                        <span className={`avatar-title rounded-circle bg-soft-${card.color} text-${card.color} font-size-18`}>
                                            <i className={card.icon}></i>
                                        </span>
                                    </div>
                                    <h5 className="font-size-14 mb-0">{card.title}</h5>
                                </div>
                                <h4 className="mb-0">{formatCurrency(card.value)}</h4>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Próximos Recebimentos / Pendências */}
            <Row className="mt-4">
                <Col lg={12}>
                    <div className="profile-section">
                        <div className="profile-section__title">
                            <i className="mdi mdi-cash-multiple" />
                            Contas a Receber (Parcelas)
                        </div>
                        <div className="table-responsive">
                            <Table className="table-nowrap table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Vencimento</th>
                                        <th>Parcela</th>
                                        <th>Valor Orginal</th>
                                        <th>Pago</th>
                                        <th>Pendente</th>
                                        <th>Status</th>
                                        <th>Método</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivables.length > 0 ? (
                                        receivables.map((rec) => (
                                            <tr key={rec.id}>
                                                <td>{formatDate(rec.dueDate)}</td>
                                                <td>{rec.installmentNumber}/{rec.totalInstallments}</td>
                                                <td>{formatCurrency(rec.amount)}</td>
                                                <td className="text-success">{formatCurrency(rec.paid)}</td>
                                                <td className="text-danger">{formatCurrency(rec.amount - rec.paid)}</td>
                                                <td>
                                                    <StatusBadge status={rec.status} />
                                                </td>
                                                <td>
                                                    <Badge color="light" className="text-muted">
                                                        {rec.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                                            rec.paymentMethod === 'cash' ? 'Dinheiro' :
                                                                rec.paymentMethod === 'pix' ? 'PIX' : rec.paymentMethod}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">
                                                Nenhum recebível encontrado para este cliente.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Histórico de Vendas */}
            <Row className="mt-4">
                <Col lg={12}>
                    <div className="profile-section">
                        <div className="profile-section__title">
                            <i className="mdi mdi-history" />
                            Histórico de Vendas
                        </div>
                        <div className="table-responsive">
                            <Table className="table-nowrap table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Data</th>
                                        <th>Nº Venda</th>
                                        <th>Itens</th>
                                        <th>Valor Total</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.length > 0 ? (
                                        sales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td>{formatDate(sale.saleDate)}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark font-monospace">
                                                        {sale.saleNumber
                                                            ? formatSaleNumber(sale.saleNumber)
                                                            : generateShortCode(sale.id)
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    {sale.items?.map(item => item.name).join(', ') || 'Item não identificado'}
                                                </td>
                                                <td>{formatCurrency(sale.total)}</td>
                                                <td>
                                                    <StatusBadge status={sale.status} />
                                                </td>
                                                <td>
                                                    <Button color="link" size="sm" className="p-0 text-primary">
                                                        Ver Venda
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-muted">
                                                Nenhuma venda registrada para este cliente.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default ClientFinancial
