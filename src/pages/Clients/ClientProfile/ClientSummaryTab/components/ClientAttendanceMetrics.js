import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardBody, Row, Col, Badge } from 'reactstrap'
import ReactApexChart from 'react-apexcharts'

const ClientAttendanceMetrics = ({ enrollments = [] }) => {

    // Calcular estatísticas agregadas de TODAS as matrículas (histórico completo)
    // Inclui ativas, suspensas E canceladas para manter o registro histórico
    const stats = useMemo(() => {
        let totalSessions = 0
        let attended = 0
        let missed = 0

        enrollments.forEach(enr => {
            // Considerar todas as matrículas que têm dados de frequência
            const sessions = (enr.attendedSessions || 0) + (enr.missedSessions || 0)
            if (sessions > 0) {
                totalSessions += sessions
                attended += enr.attendedSessions || 0
                missed += enr.missedSessions || 0
            }
        })

        const frequencyRate = totalSessions > 0 ? (attended / totalSessions) * 100 : 0

        // Cálculo simplificado de Risco de Abandono
        // Lógica: 
        // - Frequência > 85%: Risco Baixo (0-30)
        // - Frequência 50-85%: Risco Médio (30-70)
        // - Frequência < 50%: Risco Alto (70-100)
        // Invertemos a frequência para obter o "Risco"
        let riskScore = 0

        if (totalSessions === 0) {
            riskScore = 0 // Sem dados
        } else {
            const riskFactor = 100 - frequencyRate
            // Ajustes finos podem ser feitos aqui (ex: peso maior para faltas recentes)
            riskScore = riskFactor
        }

        return {
            totalSessions,
            attended,
            missed,
            frequencyRate,
            riskScore,
            riskLevel: riskScore < 30 ? 'Baixo' : riskScore < 70 ? 'Médio' : 'Alto',
            riskColor: riskScore < 30 ? '#4CAF50' : riskScore < 70 ? '#FF9800' : '#F44336'
        }
    }, [enrollments])

    // Configuração do Gráfico de Risco (Gauge)
    const chartOptions = {
        chart: {
            height: 250,
            type: 'radialBar',
            fontFamily: 'Inter, sans-serif',
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 15,
                    size: '65%',
                    image: undefined,
                    imageOffsetX: 0,
                    imageOffsetY: 0,
                    position: 'front',
                },
                track: {
                    background: '#f2f2f2',
                    strokeWidth: '97%',
                    margin: 0,
                },
                dataLabels: {
                    show: true,
                    name: {
                        offsetY: 20,
                        show: true,
                        color: '#888',
                        fontSize: '14px'
                    },
                    value: {
                        formatter: function (val) {
                            return parseInt(val) + "%";
                        },
                        color: '#111',
                        fontSize: '30px',
                        show: true,
                        offsetY: -10,
                    }
                }
            }
        },
        fill: {
            colors: [stats.riskColor],
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: [stats.riskColor],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: {
            lineCap: 'round'
        },
        labels: ['Risco de Abandono'],
    }

    if (enrollments.length === 0) return null

    return (
        <Card className="border-0 shadow-sm mb-4">
            <CardBody>
                <h5 className="card-title mb-4 fw-bold d-flex align-items-center">
                    <i className="mdi mdi-chart-timeline-variant text-primary me-2 font-size-20" />
                    Análise de Engajamento e Frequência
                </h5>

                <Row className="align-items-center">
                    {/* Coluna Esquerda: Risco */}
                    <Col lg={4} className="text-center border-end">
                        <div style={{ position: 'relative', marginTop: '-10px' }}>
                            {stats.totalSessions > 0 ? (
                                <ReactApexChart
                                    options={chartOptions}
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
                                    <strong>Atenção:</strong> Frequência abaixo de 75%. Considere entrar em contato para entender os motivos.
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </CardBody>
        </Card>
    )
}

ClientAttendanceMetrics.propTypes = {
    enrollments: PropTypes.array
}

export default ClientAttendanceMetrics
