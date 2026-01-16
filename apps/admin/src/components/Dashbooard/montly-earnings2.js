import React, { useMemo } from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import PropTypes from "prop-types"
import { MONTHS_SHORT } from "../../constants/months"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const formatCurrency = value => currencyFormatter.format(value || 0)

const monthLabel = idOrName => {
  if (idOrName && idOrName.length <= 4 && !idOrName.includes("-")) return idOrName
  if (!idOrName) return ""
  const [y, m] = idOrName.split("-").map(Number)
  if (!y || !m) return idOrName
  return m >= 1 && m <= 12 ? `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}` : idOrName
}

const MonthlyEarnings = ({ current, previous, data = [] }) => {
  const chartOptions = useMemo(() => ({
    colors: ["#28bbe3", "#c8cbd3"],
    chart: {
      stacked: false,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      bar: { columnWidth: "60%" },
    },
    grid: {
      borderColor: "#f8f8fa",
      row: { colors: ["transparent", "transparent"], opacity: 0.5 },
    },
    xaxis: {
      categories: data.map(entry => monthLabel(entry.month)),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: val => formatCurrency(val) },
    },
    tooltip: {
      y: { formatter: val => formatCurrency(val) },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    stroke: {
      width: 2,
      colors: ["transparent"],
    },
  }), [data])

  const chartSeries = useMemo(() => [
    { name: "Ano atual", data: data.map(entry => entry.current) },
    { name: "Ano passado", data: data.map(entry => entry.previous) },
  ], [data])

  return (
    <Card className="h-100 shadow-sm" style={{ minHeight: "460px" }}>
      <CardBody>
        <h4 className="card-title mb-4">Faturamento Mensal</h4>

        <Row className="text-center mt-4">
          <Col xs="6">
            <h5 className="font-size-20">{formatCurrency(current)}</h5>
            <p className="text-muted">Receita do mês</p>
          </Col>
          <Col xs="6">
            <h5 className="font-size-20">{formatCurrency(previous)}</h5>
            <p className="text-muted">Ano passado</p>
          </Col>
        </Row>

        <div id="morris-bar-stacked" className="morris-charts morris-charts-height" dir="ltr">
          <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height="300" />
        </div>
      </CardBody>
    </Card>
  )
}

MonthlyEarnings.propTypes = {
  current: PropTypes.number,
  previous: PropTypes.number,
  data: PropTypes.array
}

export default MonthlyEarnings
