import React, { useEffect } from "react"
import { connect } from "react-redux"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
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

import CashFlowChart from "components/Dashbooard/cash-flow"
import { setBreadcrumbItems } from "../../../store/actions"
import PageLoader from "../../../components/Common/PageLoader"
import OverlayLoader from "../../../components/Common/OverlayLoader"

import { formatCurrency, formatRange } from "./Utils/cashFlowUtils"
import { formatDate } from "../../../helpers/date"
import { useCashFlowLogic } from "./Hooks/useCashFlowLogic"

const CashFlowPage = ({ setBreadcrumbItems }) => {
  const {
    isLoading,
    setDateRange,
    startDate,
    endDate,
    transactions,
    summary,
    chartData,
    loadData
  } = useCashFlowLogic()

  useEffect(() => {
    const breadcrumbs = [
      { title: "Financeiro", link: "/financial" },
      { title: "Fluxo de Caixa", link: "/financial/cashflow" },
    ]
    setBreadcrumbItems("Fluxo de Caixa", breadcrumbs)
  }, [setBreadcrumbItems])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading('page') && !transactions.length) {
    return <PageLoader />
  }

  return (
    <Container fluid className="cashflow-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div className="d-flex align-items-center gap-2 ms-auto">
          <span className="text-muted small d-none d-md-inline">Período</span>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={range => setDateRange(range)}
            isClearable
            dateFormat="dd/MM/yyyy"
            className="form-control"
            placeholderText="Selecione um período"
          />
        </div>
      </div>
      <p className="text-muted small mb-3">{formatRange(startDate, endDate)}</p>

      <div style={{ position: "relative", minHeight: "400px" }}>
        <OverlayLoader show={isLoading("page")} />

        <Row className="g-4">
          {summary.map(item => (
            <Col md="4" key={item.id}>
              <Card className="shadow-sm cashier-summary-card">
                <CardBody>
                  <p className="text-muted text-uppercase fw-semibold mb-1">{item.label}</p>
                  <h3 className={`mb-0 text-${item.color}`}>{formatCurrency(item.value)}</h3>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4 mt-1">
          <Col xl="12">
            <CashFlowChart
              title="Fluxo de Caixa"
              categories={chartData.categories}
              series={chartData.series}
              showInlineSummary={false}
              height={300}
            />
          </Col>
        </Row>

        <Card className="shadow-sm mt-3 cashflow-table position-relative">
          <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h4 className="mb-1">Movimentações de caixa</h4>
              <p className="text-muted mb-0">Entradas e saídas consolidadas do período</p>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Pagamento</th>
                    <th className="text-end">Valor</th>
                    <th className="text-end">Saldo após</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(item => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{formatDate(item.date)}</td>
                      <td>{item.idTransaction || item.id}</td>
                      <td>
                        <Badge color={item.type === "sale" ? "success" : "danger"} pill>
                          {item.type === "sale" ? "Entrada" : "Saída"}
                        </Badge>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.description}</td>
                      <td>{item.method || "--"}</td>
                      <td className="text-end fw-semibold">{formatCurrency(item.amount)}</td>
                      <td className="text-end text-muted">{formatCurrency(item.balanceAfter || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(CashFlowPage)
