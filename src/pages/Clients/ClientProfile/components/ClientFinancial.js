import React, { useState } from 'react'
import { Row, Col, Card, CardBody, Table, Badge, Button, Spinner, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import classnames from 'classnames'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { formatCurrency } from '../../../../utils/format'
import { formatDate } from '../../../../utils/date'
import { formatId, generateShortCode } from '../../../../utils/sequence'
import StatusBadge from '../../../../components/Common/StatusBadge'
import ReceivableSettlementModal from '../../../Financial/Receivables/ReceivableSettlementModal'
import SaleDetailsModal from '../../../Financial/Sales/SaleDetailsModal'
import { SalesService } from '../../../../services/Sales/SalesService'

const ClientFinancial = () => {
    const {
        summary, receivables, sales, loading,
        selectedReceivable, setSelectedReceivable,
        isSettlementModalOpen, setIsSettlementModalOpen,
        handleSettle
    } = useClientFinancial()
    const [activeTab, setActiveTab] = useState('1')

    // UI State for Sales Details
    const [selectedSale, setSelectedSale] = useState(null)
    const [isSaleDetailsModalOpen, setIsSaleDetailsModalOpen] = useState(false)

    const toggle = tab => {
        if (activeTab !== tab) setActiveTab(tab)
    }

    // A função getLiveSaleStatus agora apenas delega para a Fonte Única de Verdade no Service
    const getLiveSaleStatus = (sale) => SalesService.calculateSaleStatus(sale, receivables);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner />
                <p className="text-muted mt-2">Carregando dados financeiros...</p>
            </div>
        )
    }

    const cards = [
        { title: "Volume de Vendas (Bruto)", value: summary?.totalSubtotal || 0, icon: "mdi mdi-cart-outline", color: "primary" },
        { title: "LTV (Total Recebido)", value: summary?.totalPaid || 0, icon: "mdi mdi-check-circle-outline", color: "success" },
        { title: "Saldo Devedor", value: (summary?.totalPending || 0), icon: "mdi mdi-account-cash", color: "warning" },
        { title: "A Receber (Bancos)", value: summary?.totalBankReceivable || 0, icon: "mdi mdi-bank-transfer-in", color: "info" }
    ]

    return (
        <div className="client-financial animate__animated animate__fadeIn">
            {/* KPI Cards */}
            <Row className="mb-4">
                {cards.map((card, idx) => (
                    <Col md={3} key={idx}>
                        <Card className="info-card border-0 shadow-sm h-100">
                            <CardBody>
                                <div className="d-flex align-items-center mb-3">
                                    <div className={`avatar-xs me-3`}>
                                        <span className={`avatar-title rounded-circle bg-soft-${card.color} text-${card.color} font-size-18`}>
                                            <i className={card.icon}></i>
                                        </span>
                                    </div>
                                    <h5 className="font-size-14 mb-0 text-muted">{card.title}</h5>
                                </div>
                                <h4 className={`mb-0 fw-bold ${card.color === 'danger' && card.value > 0 ? 'text-danger' : ''}`}>
                                    {formatCurrency(card.value)}
                                </h4>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Navigation Tabs */}
            <div className="bg-white p-3 rounded shadow-sm border">
                <Nav tabs className="nav-tabs-custom mb-3">
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === '1' })}
                            onClick={() => toggle('1')}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="mdi mdi-clipboard-list-outline me-2"></i>
                            Títulos a Receber
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === '2' })}
                            onClick={() => toggle('2')}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="mdi mdi-history me-2"></i>
                            Histórico de Vendas
                        </NavLink>
                    </NavItem>
                </Nav>

                <TabContent activeTab={activeTab} className="p-3 text-muted">
                    {/* TAB 1: Recebíveis (Foco em Cobrança) */}
                    <TabPane tabId="1">
                        <div className="table-responsive">
                            <Table className="table-nowrap table-hover mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Vencimento</th>
                                        <th>Descrição</th>
                                        <th>Parcela</th>
                                        <th>Valor Orig.</th>
                                        <th>Pendente</th>
                                        <th>Status</th>
                                        <th>Método</th>
                                        <th className="text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivables.length > 0 ? (
                                        receivables.map((rec) => {
                                            const isOverdue = rec.status === 'open' && new Date(rec.dueDate) < new Date();
                                            return (
                                                <tr key={rec.id} className={isOverdue ? "bg-soft-danger" : ""}>
                                                    <td className={isOverdue ? "text-danger fw-bold" : ""}>
                                                        {formatDate(rec.dueDate)}
                                                        {isOverdue && <span className="ms-1 badge bg-danger"><i className="mdi mdi-alert"></i></span>}
                                                    </td>
                                                    <td>{rec.description || 'Parcela de Venda'}</td>
                                                    <td>{rec.installmentNumber}/{rec.totalInstallments}</td>
                                                    <td>{formatCurrency(rec.amount)}</td>
                                                    <td className="fw-bold">{formatCurrency(rec.amount - rec.paid)}</td>
                                                    <td>
                                                        <StatusBadge status={rec.status} />
                                                    </td>
                                                    <td>
                                                        <Badge color="light" className="text-muted border">
                                                            {rec.paymentMethod === 'credit_card' ? 'Cartão Crédito' :
                                                                rec.paymentMethod === 'debit_card' ? 'Débito' :
                                                                    rec.paymentMethod === 'money' ? 'Dinheiro' :
                                                                        rec.paymentMethod === 'pix' ? 'PIX' :
                                                                            rec.paymentMethod === 'pending_payment' ? 'Pendente' : rec.paymentMethod}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        {(rec.status === 'open' && (rec.type === 'client' || rec.paymentMethod === 'pending_payment')) ? (
                                                            <Button
                                                                color="success"
                                                                size="sm"
                                                                className="btn-soft-success"
                                                                onClick={() => {
                                                                    setSelectedReceivable(rec);
                                                                    setIsSettlementModalOpen(true);
                                                                }}
                                                            >
                                                                Receber
                                                            </Button>
                                                        ) : rec.status === 'open' ? (
                                                            <span className="text-muted font-size-11">
                                                                <i className="mdi mdi-bank-transfer me-1"></i> Aguardando Repasse
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <div className="text-muted">

                                                    Nenhum título em aberto. Cliente em dia!
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </TabPane>

                    {/* TAB 2: Histórico de Vendas */}
                    <TabPane tabId="2">
                        <div className="table-responsive">
                            <Table className="table-nowrap table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Data</th>
                                        <th>Nº Venda</th>
                                        <th>Itens</th>
                                        <th className="text-end">Subtotal</th>
                                        <th className="text-end text-danger">Desconto</th>
                                        <th className="text-end">Total Final</th>
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
                                                    <span className="badge bg-light text-dark font-monospace border">
                                                        {sale.saleNumber
                                                            ? formatId(sale.saleNumber)
                                                            : generateShortCode(sale.id)
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    {sale.items?.slice(0, 2).map(item => item.name).join(', ')}
                                                    {sale.items?.length > 2 && <small className="text-muted ms-1">+{sale.items.length - 2} mais</small>}
                                                </td>
                                                <td className="text-end text-muted">{formatCurrency(parseFloat(sale.subtotal) || (sale.total + (sale.discount || 0)))}</td>
                                                <td className="text-end text-danger">
                                                    {sale.discount > 0 ? `- ${formatCurrency(sale.discount)}` : '-'}
                                                </td>
                                                <td className="fw-bold text-end">{formatCurrency(sale.total)}</td>
                                                <td>
                                                    <StatusBadge status={getLiveSaleStatus(sale)} />
                                                </td>
                                                <td>
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        outline
                                                        className="waves-effect"
                                                        onClick={() => {
                                                            setSelectedSale(sale);
                                                            setIsSaleDetailsModalOpen(true);
                                                        }}
                                                    >
                                                        Detalhes
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                Nenhuma venda registrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </TabPane>

                </TabContent>
            </div>

            {/* Modal de Baixa de Recebimento */}
            {selectedReceivable && (
                <ReceivableSettlementModal
                    isOpen={isSettlementModalOpen}
                    toggle={() => setIsSettlementModalOpen(!isSettlementModalOpen)}
                    receivable={selectedReceivable}
                    onSettle={handleSettle}
                />
            )}

            {/* Modal de Detalhes da Venda */}
            {selectedSale && (
                <SaleDetailsModal
                    isOpen={isSaleDetailsModalOpen}
                    toggle={() => setIsSaleDetailsModalOpen(!isSaleDetailsModalOpen)}
                    sale={selectedSale}
                    receivables={receivables}
                />
            )}
        </div>
    )
}

export default ClientFinancial
