import React from "react"
import { Card, CardBody, CardHeader, Col, Row, Table, Badge } from "reactstrap"
import DatePicker, { registerLocale } from "react-datepicker"
import ptBR from "date-fns/locale/pt-BR"
import "react-datepicker/dist/react-datepicker.css"
import ReactApexChart from "react-apexcharts"
import { formatDate } from "../../../helpers/date"
import { formatComparison } from "../../../helpers/presence"
import { RISK_CHART_CONFIG as riskChart, isPresent } from "../Utils/presenceUtils"
import { useClientPresence } from "../Hooks/useClientPresence"

registerLocale("pt-BR", ptBR)

const ClientPresence = ({ presences = [] }) => {
  const {
    setRange,
    startDate,
    endDate,
    monthlyStats,
    filtered,
    summary
  } = useClientPresence(presences)

  return (
    <Row className="g-4 align-items-stretch">
      <Col lg="8">
        <Card className="shadow-sm h-100">
          <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="mb-0">Presenças</h5>
              <p className="text-muted mb-0 small">Filtre por período para ver o histórico.</p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={update => setRange(update)}
                isClearable
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="Período"
                locale="pt-BR"
              />
              <div className="text-muted small">
                Presenças: {summary.pres}/{summary.total} · Faltas: {summary.abs}
              </div>
            </div>
          </CardHeader>
          <CardBody className="d-flex flex-column">
            <div className="table-responsive flex-grow-1">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Atividade</th>
                    <th>Professor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.idSession || row.id}>
                      <td className="fw-semibold">{formatDate(row.activityDate || row.sessionDate || row.date)}</td>
                      <td>
                        <Badge color={isPresent(row.status) ? "success" : "danger"}>
                          {row.statusLabel || (isPresent(row.status) ? "Presente" : "Falta")}
                        </Badge>
                      </td>
                      <td>{row.className || row.activity}</td>
                      <td>{row.instructor || row.teacher || "—"}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan="4" className="text-muted">
                        Nenhum registro de presença no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col lg="4">
        <Card className="shadow-sm h-100 mb-4">
          <CardHeader>
            <h6 className="mb-0">Presenças do Mês</h6>
            <small className="text-muted">{monthlyStats.current.monthLabel}</small>
          </CardHeader>
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="text-muted small">Presenças</div>
                <div className="h4 mb-0 fw-bold">{monthlyStats.current.attended}</div>
                <div className="text-muted small">de {monthlyStats.current.expected}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Frequência</div>
                <div className="h4 mb-0 fw-bold">{Math.round(monthlyStats.current.frequency)}%</div>
                <div className="text-muted small">do mês</div>
              </div>
            </div>

            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Comparativo com mês anterior</span>
                <Badge color={formatComparison(monthlyStats.comparison.attended).color} className="px-2 py-1">
                  <i className={`mdi ${formatComparison(monthlyStats.comparison.attended).icon} me-1`}></i>
                  {formatComparison(monthlyStats.comparison.attended).formatted}
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Variação frequência</span>
                <Badge color={formatComparison(monthlyStats.comparison.frequency).color} className="px-2 py-1">
                  <i className={`mdi ${formatComparison(monthlyStats.comparison.frequency).icon} me-1`}></i>
                  {formatComparison(monthlyStats.comparison.frequency).formatted}%
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm h-100">
          <CardHeader>
            <h6 className="mb-0">Risco de abandono</h6>
          </CardHeader>
          <CardBody className="d-flex flex-column justify-content-center">
            <ReactApexChart options={riskChart.options} series={riskChart.series} type="area" height={220} />
            <div className="text-muted small text-center mt-3">
              Presenças: {summary.pres}/{summary.total} · Faltas: {summary.abs}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ClientPresence
