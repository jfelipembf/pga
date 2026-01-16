import React, { Component } from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import ReactApexChart from "react-apexcharts"

const formatValue = value =>
  typeof value === "number"
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    : value

class CashFlow extends Component {
  constructor(props) {
    super(props)

    const categories = props.categories || []
    const series = props.series || []
    const colors = props.colors || ["#34c38f", "#f46a6a", "#f1b44c"]

    this.state = {
      options: {
        colors,
        chart: {
          toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 0.1 },
        grid: {
          borderColor: "#f8f8fa",
          row: {
            colors: ["transparent", "transparent"],
            opacity: 0.5,
          },
        },
        xaxis: {
          categories,
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        legend: { show: false },
        tooltip: {
          y: {
            formatter: val => formatValue(val),
          },
        },
      },
      series,
    }
  }

  componentDidUpdate(prevProps) {
    const categoriesChanged = prevProps.categories !== this.props.categories
    const seriesChanged = prevProps.series !== this.props.series
    if (categoriesChanged || seriesChanged) {
      this.setState(prevState => ({
        options: {
          ...prevState.options,
          xaxis: {
            ...prevState.options.xaxis,
            categories: this.props.categories || [],
          },
        },
        series: this.props.series || [],
      }))
    }
  }

  render() {
    const {
      title = "Fluxo de Caixa",
      summaryData,
      height = 300,
      showInlineSummary = true,
    } = this.props

    const summaries = summaryData || []

    const colSize = summaries.length ? Math.floor(12 / summaries.length) : 4

    return (
      <Card>
        <CardBody>
          <h4 className="card-title mb-4">{title}</h4>

          {showInlineSummary && (
            <Row className="text-center mt-3">
              {summaries.map((item, idx) => (
                <Col
                  xs="12"
                  sm={colSize || 4}
                  md={colSize || 4}
                  className="mb-3 mb-md-0"
                  key={`${item.label || "item"}-${idx}`}
                >
                  <h5 className="font-size-20">{formatValue(item.value)}</h5>
                  <p className="text-muted mb-0">{item.label}</p>
                </Col>
              ))}
            </Row>
          )}

          <div className="mt-3" dir="ltr">
            <ReactApexChart
              options={this.state.options}
              series={this.state.series}
              type="area"
              height={height}
            />
          </div>
        </CardBody>
      </Card>
    )
  }
}

export default CashFlow
