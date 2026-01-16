import React from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap"
import StatusBadge from "../../../components/Common/StatusBadge"
import { formatComparison } from "../../../helpers/presence"
import ReactApexChart from "react-apexcharts"

import { useClientSummary } from "../Hooks/useClientSummary"
import { formatCurrency } from "../Utils/financialUtils"

const ClientSummary = ({ onOpenTab, client, contracts = [], financial = [], presences = [], enrollments = [], attendanceMonthly = [] }) => {

  const {
    monthlyWave,
    presenceCard,
    financialSummary,
    recentTransactions
  } = useClientSummary({
    client,
    contracts,
    financial,
    presences,
    enrollments,
    attendanceMonthly
  })

  return (
    <div className="client-summary">
      <Row className="g-4">
        <Col lg="8">
          <Card className="shadow-sm h-100">
            <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="mb-0">Perfil</h5>
                <p className="text-muted mb-0 small">Informações principais do cliente.</p>
              </div>
            </CardHeader>
            <CardBody>
              <Row className="g-3">
                <Col md="4">
                  <div className="client-summary__label">Nome</div>
                  <div className="fw-semibold">
                    {client ? `${client.firstName || ""} ${client.lastName || ""}`.trim() : "--"}
                  </div>
                </Col>
                <Col md="2">
                  <div className="client-summary__label">ID</div>
                  <div className="fw-semibold">{client?.idGym || "--"}</div>
                </Col>
                <Col md="3">
                  <div className="client-summary__label">Telefone</div>
                  <div className="fw-semibold">{client?.phone || "--"}</div>
                </Col>
                <Col md="3">
                  <div className="client-summary__label">Cidade/UF</div>
                  <div className="fw-semibold">
                    {client?.city || "--"} {client?.state ? `- ${client.state}` : ""}
                  </div>
                </Col>
                <Col md="6">
                  <div className="client-summary__label">E-mail</div>
                  <div className="fw-semibold">{client?.email || "--"}</div>
                </Col>
                <Col md="3">
                  <div className="client-summary__label">Nascimento</div>
                  <div className="fw-semibold">{client?.birthDate || "--"}</div>
                </Col>
                <Col md="3">
                  <div className="client-summary__label">Status</div>
                  <Badge
                    color={
                      client?.status === "lead"
                        ? "warning"
                        : client?.status === "inactive"
                          ? "secondary"
                          : client?.status === "pending"
                            ? "info"
                            : "success"
                    }
                  >
                    {client?.status || "—"}
                  </Badge>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col lg="4">
          <Card className="shadow-sm h-100">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Financeiro</h6>
              <Button color="link" className="p-0" onClick={() => onOpenTab?.("Financeiro")}>
                Ver detalhes
              </Button>
            </CardHeader>
            <CardBody className="d-grid gap-3">
              <Row className="g-2">
                {financialSummary.map(item => (
                  <Col xs="12" key={item.id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted fs-12 text-uppercase fw-semibold">{item.label}</span>
                      <span className={`fw-semibold text-${item.color}`}>{formatCurrency(item.value)}</span>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="client-summary__label mb-2">Últimas transações</div>
              <div className="d-grid gap-2">
                {recentTransactions.map((tx, idx) => (
                  <div
                    className="d-flex justify-content-between small"
                    key={`${tx.id || tx.idTransaction || "tx"}-${idx}`}
                  >
                    <span className="text-muted">{tx.description || tx.label}</span>
                    <span className={`fw-semibold ${Number(tx.amount || tx.value) < 0 ? "text-success" : ""}`}>
                      {formatCurrency(tx.amount ?? tx.value)}
                    </span>
                  </div>
                ))}
                {!recentTransactions.length && <span className="text-muted small">Sem transações.</span>}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col lg="8">
          <Card className="shadow-sm h-100">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Contratos</h6>
              <Button color="link" className="p-0" onClick={() => onOpenTab?.("Contratos")}>
                Ver todos
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Contrato</th>
                    <th>Período</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.slice(0, 5).map((item, idx) => (
                    <tr key={`${item.idContract || item.id || "contract"}-${idx}`}>
                      <td className="fw-semibold">{item.contractTitle || item.name || item.title}</td>
                      <td>
                        <div className="text-muted small">Início: {item.startDate || item.start || "—"}</div>
                        <div className="text-muted small">Fim: {item.endDate || item.end || "—"}</div>
                      </td>
                      <td className="text-center">
                        <StatusBadge status={item.status} type="contract" />
                      </td>
                      <td className="text-end">
                        <Button color="link" className="px-2" onClick={() => onOpenTab?.("Contratos")}>
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!contracts.length && (
                    <tr>
                      <td colSpan="4" className="text-muted">
                        Nenhum contrato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
        <Col lg="4">
          <Card className="shadow-sm h-100">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Presenças recentes</h6>
              <Button color="link" className="p-0" onClick={() => onOpenTab?.("Presenças")}>
                Ver todas
              </Button>
            </CardHeader>
            <CardBody className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="text-muted small">Total aulas</div>
                  <div className="h5 mb-0 fw-bold">{presenceCard.current.expected}</div>
                  <div className="text-muted small">{presenceCard.current.monthLabel}</div>
                </div>
                <div className="text-end">
                  <div className="text-muted small">Presenças</div>
                  <div className="h5 mb-0 fw-bold">{presenceCard.current.attended}</div>
                  <div className="text-muted small">Frequência: {Math.round(presenceCard.current.frequency)}%</div>
                </div>
              </div>

              {monthlyWave.hasData && (
                <div>
                  <ReactApexChart options={monthlyWave.options} series={monthlyWave.series} type="area" height={120} />
                  <div className="text-muted small text-center mt-2">
                    Passe o mouse no gráfico para ver presenças / máximo do mês.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Comparativo mês anterior</span>
                <div className="d-flex gap-2">
                  <Badge color={formatComparison(presenceCard.comparison.attended).color} className="px-2 py-1">
                    <i className={`mdi ${formatComparison(presenceCard.comparison.attended).icon} me-1`}></i>
                    {formatComparison(presenceCard.comparison.attended).formatted}
                  </Badge>
                  <Badge color={formatComparison(presenceCard.comparison.frequency).color} className="px-2 py-1">
                    <i className={`mdi ${formatComparison(presenceCard.comparison.frequency).icon} me-1`}></i>
                    {formatComparison(presenceCard.comparison.frequency).formatted}%
                  </Badge>
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
