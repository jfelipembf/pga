import React, { Component } from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import { MONTHS_SHORT } from "../../constants/months"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const defaultMonthlyComparison = [
  { month: "Jan", current: 21560, previous: 19870 },
  { month: "Fev", current: 22840, previous: 20510 },
  { month: "Mar", current: 23690, previous: 21950 },
  { month: "Abr", current: 24980, previous: 23120 },
  { month: "Mai", current: 25830, previous: 24560 },
  { month: "Jun", current: 26740, previous: 25210 },
  { month: "Jul", current: 27560, previous: 26350 },
  { month: "Ago", current: 28910, previous: 27180 },
  { month: "Set", current: 29750, previous: 27940 },
  { month: "Out", current: 30580, previous: 28670 },
  { month: "Nov", current: 31840, previous: 29810 },
  { month: "Dez", current: 33120, previous: 31200 },
]

const formatCurrency = value => currencyFormatter.format(value)
const monthLabel = idOrName => {
  if (idOrName && idOrName.length <= 4 && !idOrName.includes("-")) return idOrName
  if (!idOrName) return ""
  const [y, m] = idOrName.split("-").map(Number)
  if (!y || !m) return idOrName
  return m >= 1 && m <= 12 ? `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}` : idOrName
}

class MonthlyEarnings extends Component {
  constructor(props) {
    super(props)

    const monthlyComparison = props.data || defaultMonthlyComparison
    const chartCategories = monthlyComparison.map(entry => monthLabel(entry.month))
    const currentSeriesData = monthlyComparison.map(entry => entry.current)
    const previousSeriesData = monthlyComparison.map(entry => entry.previous)

    this.state = {
      options: {
        colors: ["#28bbe3", "#c8cbd3"],
        chart: {
          stacked: false,
          toolbar: {
            show: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        plotOptions: {
          bar: {
            columnWidth: "60%",
          },
        },
        grid: {
          borderColor: "#f8f8fa",
          row: {
            colors: ["transparent", "transparent"],
            opacity: 0.5,
          },
        },
        xaxis: {
          categories: chartCategories,
          labels: {
            formatter: val => val,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          title: {
            text: undefined,
          },
          labels: {
            formatter: val => formatCurrency(val),
          },
        },
        tooltip: {
          y: {
            formatter: val => formatCurrency(val),
          },
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
      },
      series: [
        {
          name: "Ano atual",
          data: currentSeriesData,
        },
        {
          name: "Ano passado",
          data: previousSeriesData,
        },
      ],
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      const monthlyComparison = this.props.data || defaultMonthlyComparison
      const chartCategories = monthlyComparison.map(entry => monthLabel(entry.month))
      const currentSeriesData = monthlyComparison.map(entry => entry.current)
      const previousSeriesData = monthlyComparison.map(entry => entry.previous)

      this.setState(prevState => ({
        options: {
          ...prevState.options,
          xaxis: {
            ...prevState.options.xaxis,
            categories: chartCategories,
          },
        },
        series: [
          { name: "Ano atual", data: currentSeriesData },
          { name: "Ano passado", data: previousSeriesData },
        ],
      }))
    }
  }
  render() {
    const monthlyComparison = this.props.data || defaultMonthlyComparison
    const latest = this.props.current != null && this.props.previous != null
      ? { current: this.props.current, previous: this.props.previous }
      : monthlyComparison[monthlyComparison.length - 1] // fallback
    return (
      <React.Fragment>
        <Card className="h-100 shadow-sm monthly-earnings-card">
          <CardBody>
            <h4 className="card-title mb-4">Faturamento Mensal</h4>

            <Row className="text-center mt-4">
              <Col xs="6">
                <h5 className="font-size-20">{formatCurrency(latest.current || 0)}</h5>
                <p className="text-muted">Receita do mês</p>
              </Col>
              <Col xs="6">
                <h5 className="font-size-20">{formatCurrency(latest.previous || 0)}</h5>
                <p className="text-muted">Ano passado</p>
              </Col>
            </Row>

            <div id="morris-bar-stacked" className="morris-charts morris-charts-height" dir="ltr">
              <ReactApexChart options={this.state.options} series={this.state.series} type="bar" height="300" />
            </div>
          </CardBody>
          <style>{`
            .monthly-earnings-card {
                min-height: auto;
            }
            @media (min-width: 1200px) {
                .monthly-earnings-card {
                    min-height: 460px;
                }
            }
          `}</style>
        </Card>
      </React.Fragment>
    )
  }
}

export default MonthlyEarnings
