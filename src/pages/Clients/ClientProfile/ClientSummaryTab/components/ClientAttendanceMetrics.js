import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardBody, Row, Col, Badge } from 'reactstrap'
import ReactApexChart from 'react-apexcharts'
import { AttendanceRules } from '../../../../../services/Classes/domain/AttendanceRules'

const ClientAttendanceMetrics = ({ enrollments = [] }) => {

    // Calcular estatísticas agregadas e mensais via Rules (Fonte de Verdade Única)
    const stats = useMemo(() => {
        return AttendanceRules.calculateClientAttendanceStats(enrollments)
    }, [enrollments])

    // Configuração do Gráfico de Risco (Gauge)
    const gaugeOptions = {
        chart: { type: 'radialBar', fontFamily: 'Inter, sans-serif' },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '65%', position: 'front' },
                track: { background: '#f2f2f2', strokeWidth: '97%' },
                dataLabels: {
                    name: { offsetY: 20, color: '#888', fontSize: '14px' },
                    value: {
                        formatter: val => parseInt(val) + "%",
                        color: '#111', fontSize: '30px', offsetY: -10, show: true
                    }
                }
            }
        },
        fill: { colors: [stats.riskColor] },
        stroke: { lineCap: 'round' },
        labels: ['Risco de Abandono'],
    }

    // Configuração do Gráfico de Tendência Mensal
    const trendOptions = {
        chart: {
            type: 'bar',
            height: 250,
            stacked: false,
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: stats.monthlyData.categories,
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { title: { text: 'Sessões' } },
        fill: { opacity: 1 },
        colors: ['#4CAF50', '#F44336'], // Verde para presença, Vermelho para falta
        legend: { position: 'top', horizontalAlign: 'right' },
        tooltip: {
            y: { formatter: val => `${val} sessões` }
        }
    }

    const trendSeries = [
        { name: 'Presenças', data: stats.monthlyData.attended },
        { name: 'Faltas', data: stats.monthlyData.missed }
    ]

    if (enrollments.length === 0) return null

    return (
        <React.Fragment>
            <Card className="border-0 shadow-sm mb-4">
                <CardBody>
                    <h5 className="card-title mb-4 fw-bold d-flex align-items-center">
                        <i className="mdi mdi-chart-timeline-variant text-primary me-2 font-size-20" />
                        Análise de Engajamento e Frequência
                    </h5>

                    <Row className="align-items-center mb-4">
                        {/* Coluna Esquerda: Risco */}
                        <Col lg={4} className="text-center border-end">
                            <div style={{ position: 'relative', marginTop: '-10px' }}>
                                {stats.totalSessions > 0 ? (
                                    <ReactApexChart
                                        options={gaugeOptions}
                                        series={[stats.riskScore]}
                                        type="radialBar"
                                        height={240}
                                    />
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <i className="mdi mdi-chart-donut-variant font-size-24 mb-2"></i>
                                        <p>Dados insuficientes.</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '-20px' }}>
                                <p className="text-muted mb-1 font-size-13">Risco de Evasão</p>
                                <Badge
                                    color={stats.riskLevel === 'Baixo' ? 'success' : stats.riskLevel === 'Médio' ? 'warning' : 'danger'}
                                    className="px-3 py-1 font-size-12 rounded-pill shadow-sm"
                                >
                                    {stats.riskLevel}
                                </Badge>
                            </div>
                        </Col>

                        {/* Coluna Direita: Métricas Detalhadas */}
                        <Col lg={8} className="ps-lg-4 mt-4 mt-lg-0">
                            <Row className="text-center mb-4">
                                <Col xs={4}>
                                    <div className="p-2 rounded bg-light border border-dashed">
                                        <h4 className="mb-0 fw-bold text-dark">{stats.attended}</h4>
                                        <p className="text-muted small mb-0 mt-1">Presenças</p>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="p-2 rounded bg-light border border-dashed border-danger-subtle">
                                        <h4 className="mb-0 fw-bold text-danger">{stats.missed}</h4>
                                        <p className="text-muted small mb-0 mt-1">Faltas</p>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="p-2 rounded bg-primary-subtle border border-primary-subtle">
                                        <h4 className="mb-0 fw-bold text-primary">{stats.frequencyRate.toFixed(0)}%</h4>
                                        <p className="text-primary-emphasis small mb-0 mt-1">Frequência</p>
                                    </div>
                                </Col>
                            </Row>

                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted font-size-13 fw-medium">Assiduidade Geral</span>
                                    <span className={`fw-bold font-size-13 ${stats.frequencyRate > 85 ? 'text-success' : 'text-warning'}`}>
                                        {stats.frequencyRate.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="progress mb-3" style={{ height: "8px", borderRadius: "4px" }}>
                                    <div
                                        className={`progress-bar bg-${stats.frequencyRate > 85 ? 'success' : stats.frequencyRate > 60 ? 'warning' : 'danger'}`}
                                        role="progressbar"
                                        style={{ width: `${stats.frequencyRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            {stats.totalSessions > 0 && stats.frequencyRate < 75 && (
                                <div className="alert alert-warning border-0 bg-warning-subtle text-warning-emphasis mb-0 d-flex align-items-center mt-3" role="alert">
                                    <i className="mdi mdi-alert-outline font-size-20 me-2"></i>
                                    <div className="font-size-12 lh-1">
                                        <strong>Atenção:</strong> Frequência abaixo de 75%. Considere entrar em contato.
                                    </div>
                                </div>
                            )}
                        </Col>
                    </Row>

                    {/* Novo: Gráfico de Tendência Mensal */}
                    {stats.monthlyData.categories.length > 0 && (
                        <div className="mt-4 pt-4 border-top">
                            <h6 className="font-size-14 mb-4 fw-bold text-muted">
                                <i className="mdi mdi-trending-up me-2" />
                                Tendência de Frequência (Mensal)
                            </h6>
                            <ReactApexChart
                                options={trendOptions}
                                series={trendSeries}
                                type="bar"
                                height={280}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </React.Fragment>
    )
}

ClientAttendanceMetrics.propTypes = {
    enrollments: PropTypes.array
}

export default ClientAttendanceMetrics
