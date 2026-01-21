import React, { useEffect } from "react"
import { connect } from "react-redux"
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
} from "reactstrap"

import pgaLogo from "assets/images/pgaLogo.png"
import { setBreadcrumbItems } from "../../../../store/actions"
import { formatDate, formatCurrency } from "@pga/shared"

export const CashierPrintContent = ({ transactions = [], totals = {}, session = {}, settings = {}, dateRange = [] }) => {
  // Configurações podem vir aninhadas como settings.general.general.logo ou settings.general.logo
  const generalSettings = settings?.general?.general || settings?.general || {}
  const logoRight = generalSettings?.logo
  const gymName = generalSettings?.name || "Academia"

  const consultantName = session?.responsible || "Consultor"
  const generatedAt = new Date().toLocaleString("pt-BR")

  const summary = [
    { id: 1, label: "Receitas", value: totals.revenue || 0, color: "success" },
    { id: 2, label: "Despesas", value: totals.expenses || 0, color: "danger" },
    { id: 3, label: "Saldo Final", value: (totals.revenue || 0) - (totals.expenses || 0), color: "primary" },
  ]

  return (
    <>
      <header className="cashier-print__header d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
        <div className="d-flex align-items-center gap-3">
          {logoRight ? (
            <img src={logoRight} alt="Logo" height="64" style={{ objectFit: "contain", maxWidth: "150px" }} />
          ) : (
            <div style={{ width: 64, height: 64 }} />
          )}
        </div>

        <div className="text-end">
          <h4 className="mb-1 text-uppercase">{gymName}</h4>
          <p className="text-muted mb-0">Relatório de Fechamento de Caixa</p>
          <small className="text-muted">Emitido em {generatedAt}</small>
        </div>
      </header>

      <Row className="g-3 cashier-print__summary-row">
        {summary.map(item => (
          <Col md="4" key={item.id}>
            <Card className="cashier-print__summary-card h-100 border bg-light">
              <CardBody className="text-center">
                <p className="text-muted text-uppercase small mb-1 fw-bold">{item.label}</p>
                <h3 className={`mb-0 text-${item.color}`}>{formatCurrency(item.value)}</h3>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-none border mt-4">
        <CardHeader className="bg-light d-flex justify-content-between align-items-center py-2">
          <div>
            <h6 className="mb-0 fw-bold">Detalhamento Financeiro</h6>
          </div>
          <Badge color="secondary" pill>
            {transactions.length} registros
          </Badge>
        </CardHeader>
        <CardBody className="p-0">
          <div className="table-responsive">
            <Table bordered hover className="mb-0 fs-7" size="sm">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Método</th>
                  <th className="text-end">Valor</th>
                  <th className="text-center" style={{ width: "100px" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-3 text-muted">Nenhuma transação no período.</td></tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={tx.idTransaction || idx}>
                      <td className="fw-semibold">{tx.idTransaction || "--"}</td>
                      <td>
                        <Badge color={tx.type === "sale" ? "success" : "danger"} pill className="px-2">
                          {tx.type === "sale" ? "Entrada" : "Saída"}
                        </Badge>
                      </td>
                      <td>{tx.category || "--"}</td>
                      <td>{tx.description || "--"}</td>
                      <td>{tx.method || "--"}</td>
                      <td className="text-end fw-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="text-center">{formatDate(tx.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <div className="mt-5 pt-5">
        <Row>
          <Col md={{ size: 4, offset: 4 }} className="text-center">
            <div style={{ borderTop: "1px solid #000", margin: "0 auto 8px auto", width: "100%" }} />
            <p className="mb-0 fw-bold text-uppercase">{consultantName}</p>
            <small className="text-muted">Responsável pelo Caixa</small>
          </Col>
        </Row>
      </div>

      <div className="mt-5 d-flex justify-content-end align-items-center">
        <small className="text-muted me-2">Powered by</small>
        <img src={pgaLogo} alt="Swim" height="50" style={{ opacity: 0.8 }} />
      </div>
    </>
  )
}

// Deprecated standalone page (kept to avoid breakages, but effectively broken without props)
const CashierPrintPage = ({ setBreadcrumbItems }) => {
  useEffect(() => {
    setBreadcrumbItems("Impressão do Caixa", [])
  }, [setBreadcrumbItems])

  return (
    <Container fluid>
      <div className="alert alert-warning">
        Esta página de impressão deve ser acessada através do painel do Caixa.
      </div>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(CashierPrintPage)
