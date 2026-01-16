import React, { Component } from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import { MONTHS_SHORT } from "../../constants/months"

const MONTH_LABELS = MONTHS_SHORT
const MONTHLY_REVENUE = [32000, 28500, 29800, 31250, 33400, 34120, 35500, 36210, 37100, 38850, 40220, 41780]
const formatCurrency = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

class YearlySales extends Component {
  constructor(props) {
    super(props)

    this.state = {
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        colors: ["#7A6FBE"],
        plotOptions: {
          bar: {
            columnWidth: "45%",
            dataLabels: {
              show: false,
            },
          },
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          show: true,
          borderColor: "#f0f0f0",
          xaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {
          categories: MONTH_LABELS,
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            style: {
              colors: "#6c757d",
            },
          },
        },
        yaxis: {
          labels: {
            formatter: val => `R$ ${(val / 1000).toFixed(0)}k`,
            style: {
              colors: "#6c757d",
            },
          },
        },
        tooltip: {
          y: {
            formatter: val => formatCurrency(val),
          },
        },
      },
      series: [
        {
          name: "Faturamento",
          data: MONTHLY_REVENUE,
        },
      ],
    }
  }
  render() {
    const totalRevenue = MONTHLY_REVENUE.reduce((sum, value) => sum + value, 0)
    return (
      <React.Fragment>
        <Card>
          <CardBody>
            <h4 className="card-title mb-4">Faturamento anual</h4>
            <Row className="align-items-center">
              <Col md="4">
                <div>
                  <h3 className="fw-semibold">{formatCurrency(totalRevenue)}</h3>
                  <p className="text-muted mb-1">Volume total no ano</p>
                  <small className="text-muted">Baseado em contratos ativos por mês</small>
                </div>
              </Col>
              <Col md="8">
                <div id="sparkline">
                  <ReactApexChart options={this.state.options} series={this.state.series} type="bar" height="180" className="apex-charts" />
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </React.Fragment>
    )
  }
}

export default YearlySales