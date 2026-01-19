import React, { useState, useMemo } from "react"
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Table,
    Badge,
    Row,
    Col,
    Card,
    CardBody
} from "reactstrap"
import classnames from "classnames"
import { formatDate } from "../../../helpers/date"
import { formatCurrency } from "../Utils/financialUtils"
import { getStatusColor, getStatusLabel } from "../../../helpers/status"

const TransactionDetailsModal = ({ isOpen, toggle, transaction, allTransactions = [] }) => {
    const [activeTab, setActiveTab] = useState("1")

    const toggleTab = tab => {
        if (activeTab !== tab) setActiveTab(tab)
    }

    // Find related transactions (installments) based on idSale
    const relatedTransactions = useMemo(() => {
        if (!transaction?.idSale && !transaction?.raw?.idSale) return []
        const saleId = transaction.idSale || transaction.raw?.idSale

        // Filter and sort by installment number or date
        return allTransactions
            .filter(t => (t.idSale === saleId || t.raw?.idSale === saleId))
            .sort((a, b) => {
                const instA = a.raw?.metadata?.installment || 0
                const instB = b.raw?.metadata?.installment || 0
                return instA - instB
            })
    }, [transaction, allTransactions])

    const metadata = transaction?.raw?.metadata || transaction?.metadata || {}
    const isInstallment = metadata.totalInstallments > 1
    const currentInstallment = metadata.installment || 1

    // Financial calculations
    const grossAmount = transaction?.raw?.grossAmount || transaction?.amount || 0
    const netAmount = transaction?.raw?.netAmount || 0 // Might be 0 for legacy transactions
    const feeAmount = transaction?.raw?.feeAmount || 0

    const hasFinancialDetails = grossAmount > 0 && (netAmount > 0 || feeAmount > 0)

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
                Detalhes da Transação <span className="text-muted fw-normal ms-2">#{transaction?.idTransaction || transaction?.id}</span>
            </ModalHeader>
            <ModalBody>
                <div className="text-center mb-4">
                    <h2 className="mb-0 fw-bold">{formatCurrency(transaction?.amount)}</h2>
                    <div className="mt-2">
                        <Badge color={getStatusColor(transaction?.status)} className="fs-12 px-3 py-1">
                            {getStatusLabel(transaction?.status, "sale")}
                        </Badge>
                    </div>
                </div>

                <Nav tabs className="nav-tabs-custom nav-justified mb-3">
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === "1" })}
                            onClick={() => toggleTab("1")}
                            style={{ cursor: "pointer" }}
                        >
                            <i className="mdi mdi-text-box-outline me-2"></i>
                            Resumo
                        </NavLink>
                    </NavItem>
                    {hasFinancialDetails && (
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => toggleTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="mdi mdi-cash-multiple me-2"></i>
                                Financeiro
                            </NavLink>
                        </NavItem>
                    )}
                    {isInstallment && relatedTransactions.length > 0 && (
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => toggleTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="mdi mdi-calendar-clock me-2"></i>
                                Parcelas ({relatedTransactions.length})
                            </NavLink>
                        </NavItem>
                    )}
                </Nav>

                <TabContent activeTab={activeTab} className="p-3 text-muted">
                    <TabPane tabId="1">
                        <Row>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Data da Transação</label>
                                    <div>{formatDate(transaction?.date)}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Vendedor</label>
                                    <div>{metadata.registeredBy || transaction?.staffName || "Sistema"}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Tipo de Pagamento</label>
                                    <div className="text-capitalize">{transaction?.method || transaction?.type}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Descrição</label>
                                    <div>{transaction?.description}</div>
                                </div>
                            </Col>

                            <Col md="12"><hr /></Col>

                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Adquirente</label>
                                    <div>{metadata.acquirerName || metadata.acquirer || "-"}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Bandeira</label>
                                    <div>{metadata.brand || "-"}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Código de Autorização</label>
                                    <div>{metadata.authorization || "-"}</div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="mb-3">
                                    <label className="fw-semibold">Parcelamento</label>
                                    <div>
                                        {metadata.totalInstallments ? `${metadata.totalInstallments}x` : "À vista"}
                                        {isInstallment && <span className="text-muted ms-2">(Parcela {currentInstallment}/{metadata.totalInstallments})</span>}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tabId="2">
                        <Row className="g-3">
                            <Col md="4">
                                <Card className="border shadow-none h-100 mb-0">
                                    <CardBody className="p-3">
                                        <p className="text-muted text-uppercase fs-12 fw-bold mb-1">Valor Bruto</p>
                                        <h5 className="mb-0">{formatCurrency(grossAmount)}</h5>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="4">
                                <Card className="border shadow-none h-100 mb-0">
                                    <CardBody className="p-3">
                                        <p className="text-muted text-uppercase fs-12 fw-bold mb-1">Taxas (MDR/Antec.)</p>
                                        <h5 className="mb-0 text-danger">- {formatCurrency(feeAmount)}</h5>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="4">
                                <Card className="border shadow-none bg-soft-success h-100 mb-0">
                                    <CardBody className="p-3">
                                        <p className="text-success text-uppercase fs-12 fw-bold mb-1">Valor Líquido</p>
                                        <h5 className="mb-0 text-success">{formatCurrency(netAmount || (grossAmount - feeAmount))}</h5>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col md="12" className="mt-4">
                                <h6 className="mb-3">Detalhes das Taxas</h6>
                                <Table size="sm" responsive bordered className="mb-0">
                                    <tbody>
                                        <tr>
                                            <th scope="row" style={{ width: "200px" }}>Taxa Efetiva</th>
                                            <td>
                                                {grossAmount > 0
                                                    ? `${((feeAmount / grossAmount) * 100).toFixed(2)}%`
                                                    : "0.00%"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Valor da Taxa</th>
                                            <td className="text-danger">R$ {feeAmount.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                                <p className="text-muted small mt-2">
                                    * As taxas incluem MDR (Merchant Discount Rate) e custos de antecipação, se aplicável.
                                </p>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tabId="3">
                        <div className="table-responsive">
                            <Table className="table-nowrap align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Parcela</th>
                                        <th>Vencimento/Data</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatedTransactions.map((tx, index) => {
                                        const txMeta = tx.raw?.metadata || tx.metadata || {}
                                        const instNum = txMeta.installment || index + 1
                                        return (
                                            <tr key={tx.id} className={tx.id === transaction.id ? "table-active" : ""}>
                                                <td className="fw-semibold">{instNum}ª Parcela</td>
                                                <td>{formatDate(tx.date)}</td>
                                                <td>{formatCurrency(tx.amount)}</td>
                                                <td>
                                                    <Badge color={getStatusColor(tx.status)} pill>
                                                        {getStatusLabel(tx.status, "sale")}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>
                        </div>
                        {relatedTransactions.length === 1 && transaction.raw?.metadata?.totalInstallments > 1 && (
                            <div className="alert alert-warning mt-3 mb-0">
                                Nota: Esta venda foi antecipada, gerando uma única transação financeira de entrada no caixa.
                                Os detalhes das parcelas originais do cliente com a operadora não afetam o fluxo de caixa.
                            </div>
                        )}
                    </TabPane>
                </TabContent>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Fechar</Button>
            </ModalFooter>
        </Modal>
    )
}

export default TransactionDetailsModal
