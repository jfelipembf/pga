import React, { useState, useMemo } from "react"
import { Card, CardBody, CardHeader, Row, Col, Button, Input } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import PropTypes from "prop-types"
import { MONTHS_SHORT } from "../../constants/months"

const ConversionFunnel = ({ data, historicalData = [] }) => {
  const [showHistory, setShowHistory] = useState(false)
  const [selectedMonthId, setSelectedMonthId] = useState("")

  // Available months for selection
  const availableMonths = useMemo(() => {
    return (historicalData || []).map(item => {
      if (!item.id) return null
      const [y, m] = item.id.split("-").map(Number)
      return { id: item.id, label: `${MONTHS_SHORT[(m || 1) - 1]} / ${String(y).slice(2)}` }
    }).filter(Boolean).reverse()
  }, [historicalData])

  // Process data for Funnel Chart
  const funnelData = useMemo(() => {
    const source = selectedMonthId ? (historicalData.find(h => h.id === selectedMonthId) || data) : data
    return {
      leads: Number(source?.leadsMonth || 0),
      scheduled: Number(source?.scheduled || 0),
      attended: Number(source?.attended || 0),
      converted: Number(source?.conversions || 0)
    }
  }, [data, historicalData, selectedMonthId])

  const funnelSeries = [{
    name: "Total",
    data: [funnelData.leads, funnelData.scheduled, funnelData.attended, funnelData.converted].map(v => v || 0.01)
  }]

  const funnelOptions = {
    chart: { type: "bar", height: 330, toolbar: { show: false } },
    plotOptions: {
      bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: "75%", isFunnel: true },
    },
    colors: ["#7a6fbe", "#28bbe3", "#ffbb44", "#28a745"],
    dataLabels: {
      enabled: true,
      formatter: (_val, opt) => {
        const labels = ["Leads", "Agendados", "Aula Exp.", "Vendas"]
        const realValues = [funnelData.leads, funnelData.scheduled, funnelData.attended, funnelData.converted]
        return `${labels[opt.dataPointIndex]}: ${realValues[opt.dataPointIndex]}`
      }
    },
    xaxis: { categories: ["Leads", "Agendados", "Aula Exp.", "Vendas"] },
    legend: { show: false },
    tooltip: {
      y: { formatter: (val, opt) => [funnelData.leads, funnelData.scheduled, funnelData.attended, funnelData.converted][opt.dataPointIndex] }
    }
  }

  // History Chart Processing
  const historyView = useMemo(() => {
    const categories = historicalData.map(item => {
      const [, m] = item.id.split("-").map(Number)
      return MONTHS_SHORT[(m || 1) - 1]
    })
    const seriesData = historicalData.map(item => {
      const l = Number(item.leadsMonth || 0)
      const s = Number(item.conversions || 0)
      return l > 0 ? Number(((s / l) * 100).toFixed(1)) : 0
    })

    return {
      series: [{ name: "Taxa de Conversão", data: seriesData }],
      options: {
        chart: { type: "area", height: 330, toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        colors: ["#7a6fbe"],
        xaxis: { categories },
        yaxis: { labels: { formatter: (val) => `${val}%` }, min: 0, max: 100 },
        dataLabels: { enabled: false }
      }
    }
  }, [historicalData])

  const getRate = (p, t) => (t > 0 ? ((p / t) * 100).toFixed(1) : 0)
  const rates = [
    { label: "Lead -> Agendado", value: getRate(funnelData.scheduled, funnelData.leads), color: "info" },
    { label: "Agendado -> Aula", value: getRate(funnelData.attended, funnelData.scheduled), color: "warning" },
    { label: "Aula -> Venda", value: getRate(funnelData.converted, funnelData.attended), color: "success" },
    { label: "Eficiência Geral", value: getRate(funnelData.converted, funnelData.leads), color: "primary" },
  ]

  return (
    <Card className="h-100 shadow-sm">
      <CardHeader className="bg-transparent border-bottom d-flex justify-content-between align-items-center py-2">
        <h5 className="my-0 font-size-15 fw-bold text-dark">
          {showHistory ? "Evolução da Conversão (%)" : "Funil de Vendas"}
        </h5>
        <div className="d-flex align-items-center gap-2">
          {!showHistory && availableMonths.length > 0 && (
            <Input
              type="select"
              size="sm"
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              style={{ width: "110px" }}
            >
              <option value="">Atual</option>
              {availableMonths.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </Input>
          )}
          <Button
            color="primary"
            outline
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className={`mdi ${showHistory ? "mdi-filter-variant" : "mdi-chart-areaspline"} font-size-18`}></i>
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {showHistory ? (
          <ReactApexChart options={historyView.options} series={historyView.series} type="area" height={330} />
        ) : (
          <Row>
            <Col md="8">
              <ReactApexChart options={funnelOptions} series={funnelSeries} type="bar" height={330} />
            </Col>
            <Col md="4" className="border-start">
              {rates.map((r, idx) => (
                <div key={idx} className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted font-size-12">{r.label}</span>
                    <span className={`text-${r.color} fw-bold`}>{r.value}%</span>
                  </div>
                  <div className="progress progress-sm">
                    <div className={`progress-bar bg-${r.color}`} style={{ width: `${r.value}%` }}></div>
                  </div>
                </div>
              ))}
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  )
}

ConversionFunnel.propTypes = {
  data: PropTypes.object,
  historicalData: PropTypes.array
}

export default ConversionFunnel
