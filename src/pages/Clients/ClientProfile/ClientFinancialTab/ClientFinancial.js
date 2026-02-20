import React, { useState } from 'react'
import { Row, Col, Card, CardBody, Table, Badge, Button, Spinner } from 'reactstrap'
import { useClientFinancial } from './hooks/useClientFinancial'
import { formatCurrency } from '../../../../utils/format'
import { formatDate } from '../../../../utils/date'
import { formatId, generateShortCode } from '../../../../utils/sequence'
import StatusBadge from '../../../../components/Common/StatusBadge'
import SaleDetailsModal from '../../../Financial/Sales/SaleDetailsModal'
import { SalesService } from '../../../../services/Sales/SalesService'
import SalesReceiptModal from '../../../../components/Common/SalesReceiptModal'

const ClientFinancial = ({ client }) => {
    const {
        summary, sales, receivables, loading
    } = useClientFinancial()

    // UI State for Sales Details
    const [selectedSale, setSelectedSale] = useState(null)
    const [isSaleDetailsModalOpen, setIsSaleDetailsModalOpen] = useState(false)

    // UI State for Receipt
    const [transactionForReceipt, setTransactionForReceipt] = useState(null)

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
                                <h4 className={`mb-0 fw-bold ${card.color === 'warning' && card.value > 0 ? 'text-warning' : ''}`}>
                                    {formatCurrency(card.value)}
                                </h4>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Listagem Única: Histórico de Vendas */}
            <Card className="border-0 shadow-sm">
                <CardBody>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="card-title mb-0 fw-bold">
                            <i className="mdi mdi-history text-primary me-2 font-size-18"></i>
                            Histórico de Vendas e Transações
                        </h5>
                    </div>

                    <div className="table-responsive">
                        <Table className="table-nowrap table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Data</th>
                                    <th>Nº Venda</th>
                                    <th>Produtos/Serviços</th>
                                    <th className="text-end">Subtotal</th>
                                    <th className="text-end text-danger">Desconto</th>
                                    <th className="text-end">Total Final</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-end pe-3">Ações</th>
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
                                                <div className="text-truncate" style={{ maxWidth: '250px' }}>
                                                    {sale.items?.slice(0, 2).map(item => item.name).join(', ')}
                                                    {sale.items?.length > 2 && <small className="text-muted ms-1">+{sale.items.length - 2} mais</small>}
                                                </div>
                                            </td>
                                            <td className="text-end text-muted font-size-13">
                                                {formatCurrency(parseFloat(sale.subtotal) || (sale.total + (sale.discount || 0)))}
                                            </td>
                                            <td className="text-end text-danger fw-medium">
                                                {sale.discount > 0.01 ? `- ${formatCurrency(sale.discount)}` : '—'}
                                            </td>
                                            <td className="fw-bold text-end text-dark">{formatCurrency(sale.total)}</td>
                                            <td className="text-center">
                                                <StatusBadge status={getLiveSaleStatus(sale)} />
                                            </td>
                                            <td className="text-end pe-3">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <Button
                                                        color="light"
                                                        size="sm"
                                                        className="waves-effect border"
                                                        title="Imprimir Recibo"
                                                        onClick={() => setTransactionForReceipt(sale)}
                                                    >
                                                        <i className="mdi mdi-printer font-size-14 text-dark"></i>
                                                    </Button>
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5 text-muted">
                                            Nenhuma venda registrada até o momento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>

            {/* Modal de Detalhes da Venda */}
            {selectedSale && (
                <SaleDetailsModal
                    isOpen={isSaleDetailsModalOpen}
                    toggle={() => setIsSaleDetailsModalOpen(!isSaleDetailsModalOpen)}
                    sale={selectedSale}
                    receivables={receivables}
                />
            )}

            {/* Modal de Recibo */}
            {transactionForReceipt && (
                <SalesReceiptModal
                    isOpen={!!transactionForReceipt}
                    toggle={() => setTransactionForReceipt(null)}
                    saleData={transactionForReceipt}
                    clientName={client?.name || 'Cliente'}
                />
            )}
        </div>
    )
}

export default ClientFinancial
