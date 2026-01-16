import React, { useState, useMemo } from "react"
import { Card, CardBody, CardHeader, Row, Col, Button, Input } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import { MONTHS_SHORT } from "../../constants/months"

const ConversionFunnel = ({ data, historicalData = [] }) => {
  const [showHistory, setShowHistory] = useState(false)

  // 0. Gerar lista de meses disponíveis para o seletor (últimos 12 meses)
  const availableMonths = useMemo(() => {
    const list = (historicalData || []).slice().reverse().slice(0, 12) // garantir últimos 12 do histórico

    return list.map(item => {
      if (!item.id) return null
      const [y, m] = item.id.split("-").map(Number)
      return {
        id: item.id,
        label: `${MONTHS_SHORT[(m || 1) - 1]} / ${String(y).slice(2)}`
      }
    }).filter(Boolean)
  }, [historicalData])

  const [selectedMonthId, setSelectedMonthId] = useState("")

  // 1. Dados do Funil (Mês Selecionado ou Mês Atual)
  const funnelData = useMemo(() => {
    let source = data || {}

    // Se houver um mês selecionado, buscar no histórico
    if (selectedMonthId) {
      const found = historicalData.find(h => h.id === selectedMonthId)
      if (found) source = found
    }

    // Sempre trabalhar com dados reais primeiro (sem fallback parcial)
    const rawLeads = Number(source.leadsMonth || 0)
    const rawScheduled = Number(source.scheduled || source.experimental_scheduled || 0)
    const rawAttended = Number(source.attended || 0)
    const rawConverted = Number(source.conversions || source.salesMonthCount || 0)


    // Usar valores brutos diretamente sem forçar ordem decrescente
    const leads = rawLeads
    const scheduled = rawScheduled
    const attended = rawAttended
    const converted = rawConverted

    return {
      leads,
      scheduled,
      attended,
      converted,
    }
  }, [data, historicalData, selectedMonthId])


  // ApexCharts não desenha barra (e portanto não aparece a cor) quando o valor é 0.
  // Mantemos o valor real no label/tooltip, mas usamos um valor mínimo só para renderização.
  const funnelRealValues = useMemo(() => {
    return [funnelData.leads, funnelData.scheduled, funnelData.attended, funnelData.converted]
  }, [funnelData.leads, funnelData.scheduled, funnelData.attended, funnelData.converted])

  const funnelDisplayValues = useMemo(() => {
    const minRenderValue = 0.01
    return funnelRealValues.map(v => (Number(v) === 0 ? minRenderValue : Number(v)))
  }, [funnelRealValues])

  const hasAnyFunnelData = useMemo(() => {
    return funnelRealValues.some(v => Number(v) > 0)
  }, [funnelRealValues])

  const funnelSeries = [{
    name: "Total",
    data: funnelDisplayValues,
  }]

  const funnelOptions = {
    chart: { type: "bar", height: 330, toolbar: { show: false } },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        distributed: true,
        barHeight: "75%",
        isFunnel: true,
      },
    },
    colors: ["#7a6fbe", "#28bbe3", "#ffbb44", "#28a745"],
    dataLabels: {
      enabled: true,
      formatter: (_val, opt) => {
        const idx = opt.dataPointIndex
        const real = funnelRealValues[idx] ?? 0
        return opt.w.globals.labels[idx] + ": " + real
      },
      dropShadow: { enabled: true },
    },
    xaxis: { categories: ["Novos Leads", "Agendados", "Aula Exp.", "Vendas"] },
    legend: { show: false },
    grid: { show: false },
    tooltip: {
      y: {
        formatter: (_val, opts) => {
          const idx = opts.dataPointIndex
          return funnelRealValues[idx] ?? 0
        },
      },
    },
  }

  // 2. Processamento do Histórico (12 meses - Evolução)
  const historyView = useMemo(() => {
    let categories = MONTHS_SHORT
    let seriesData = []

    const validHistory = (historicalData || []).filter(item =>
      item.id && (Number(item.leadsMonth || item.newCount || 0) > 0 || Number(item.salesMonth || 0) > 0)
    )

    if (validHistory.length > 0) {
      categories = validHistory.map(item => {
        const [, m] = item.id.split("-").map(Number)
        return MONTHS_SHORT[(m || 1) - 1]
      })
      seriesData = validHistory.map(item => {
        const l = Number(item.leadsMonth || item.newCount || 0)
        const s = Number(item.conversions || item.salesMonthCount || 0)
        return l > 0 ? Number(((s / l) * 100).toFixed(1)) : 0
      })
    }

    return {
      series: [{ name: "Taxa de Conversão", data: seriesData }],
      options: {
        chart: {
          type: "area",
          height: 330,
          toolbar: { show: false },
          animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        stroke: { curve: "smooth", width: 3 },
        fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100, 100] },
        },
        colors: ["#7a6fbe"],
        xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { formatter: (val) => `${val}%` }, min: 0, max: 100 },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (val) => `${val}%` } },
        grid: { borderColor: "#f1f1f1" }
      }
    }
  }, [historicalData])

  const hasAnyHistoryData = useMemo(() => {
    const series = historyView?.series?.[0]?.data || []
    return series.length > 0
  }, [historyView])

  // 3. Taxas de Conversão Laterais
  const getRate = (p, t) => (t > 0 ? ((p / t) * 100).toFixed(1) : 0)
  const rates = [
    { label: "Lead -> Agendado", value: getRate(funnelData.scheduled, funnelData.leads), color: "info" },
    { label: "Agendado -> Aula", value: getRate(funnelData.attended, funnelData.scheduled), color: "warning" },
    { label: "Aula -> Venda", value: getRate(funnelData.converted, funnelData.attended), color: "success" },
    { label: "Eficiência Geral", value: getRate(funnelData.converted, funnelData.leads), color: "primary" },
  ]

  return (
    <Card className="h-100 shadow-sm conversion-funnel-card">
      <CardHeader className="bg-transparent border-bottom d-flex justify-content-between align-items-center py-2">
        <h5 className="my-0 font-size-15 fw-bold text-dark">
          {showHistory ? "Evolução da Conversão (%)" : "Funil de Vendas"}
        </h5>
        <div className="d-flex align-items-center gap-2">
          {!showHistory && availableMonths.length > 0 && (
            <Input
              type="select"
              bsSize="sm"
              className="form-select-sm border-0 bg-light"
              style={{ width: "110px", fontSize: "12px" }}
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
            >
              <option value="">Mês Atual</option>
              {availableMonths.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Input>
          )}
          <Button
            color="primary"
            size="sm"
            className="btn-soft-primary border-0"
            onClick={() => setShowHistory(!showHistory)}
            style={{ width: "38px", height: "32px", padding: "0" }}
          >
            <i className={`mdi ${showHistory ? "mdi-filter-variant" : "mdi-chart-areaspline"} font-size-18`}></i>
          </Button>
        </div>
      </CardHeader>
      <CardBody className="position-relative">
        <div className="view-wrapper">
          {showHistory ? (
            <div key="history-view" className="animate-fade-in">
              {!hasAnyHistoryData ? (
                <div className="text-muted d-flex align-items-center justify-content-center" style={{ height: 330 }}>
                  Sem dados de conversão para os últimos 12 meses.
                </div>
              ) : (
                <ReactApexChart
                  key={`history-chart-${historicalData.length}`}
                  options={historyView.options}
                  series={historyView.series}
                  type="area"
                  height={330}
                />
              )}
            </div>
          ) : (
            <Row key="funnel-view" className="animate-fade-in">
              <Col md="8">
                {!hasAnyFunnelData ? (
                  <div className="text-muted d-flex align-items-center justify-content-center" style={{ height: 330 }}>
                    Sem dados para o mês selecionado.
                  </div>
                ) : (
                  <ReactApexChart
                    key={`funnel-chart-${selectedMonthId || "current"}`}
                    options={funnelOptions}
                    series={funnelSeries}
                    type="bar"
                    height={330}
                  />
                )}
              </Col>
              <Col md="4" className="d-flex flex-column justify-content-center stats-column">
                <div className="ps-2 stats-content">
                  {rates.map((r, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted font-size-12 fw-medium">{r.label}</span>
                        <span className={`text-${r.color} fw-bold font-size-13`}>{r.value}%</span>
                      </div>
                      <div className="progress progress-sm" style={{ height: "6px", backgroundColor: "#f0f0f0" }}>
                        <div className={`progress-bar bg-${r.color}`} style={{ width: `${r.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          )}
        </div>
      </CardBody>
      <style>{`
        .stats-column {
          border-left: 1px solid #eff2f7;
        }
        @media (max-width: 767px) {
          .stats-column {
            border-left: none;
            border-top: 1px solid #eff2f7;
            padding-top: 20px;
            margin-top: 10px;
          }
           .stats-content {
             padding-left: 0 !important;
           }
        }
      `}</style>
    </Card>
  )
}

export default ConversionFunnel
