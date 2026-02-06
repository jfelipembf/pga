import React from 'react'
import { Row, Col, Card, CardBody, Spinner, Table } from 'reactstrap'
import ReactApexChart from 'react-apexcharts'

const StaffMetrics = ({ metrics, loading, refresh }) => {
    if (loading && !metrics) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">Analisando desempenho do colaborador...</p>
            </div>
        )
    }

    if (!metrics) return null

    const { current, comparatives, history } = metrics

    // Configuração do Gráfico de Evolução
    const barChartOptions = {
        chart: {
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif',
            offsetY: -10
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        colors: ['#5b73e8', '#34c38f', '#f1b44c'],
        xaxis: {
            categories: history.map(h => h.month),
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            title: { text: 'Percentual (%)', style: { color: '#adb5bd', fontWeight: 500 } },
            max: 100,
            labels: {
                formatter: (val) => `${val}%`
            }
        },
        fill: { opacity: 1 },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%"
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontWeight: 500,
            markers: { radius: 12 }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 3
        }
    }

    const barChartSeries = [
        { name: 'Ocupação', data: history.map(h => h.occupancyRate) },
        { name: 'Presença', data: history.map(h => h.attendanceRate) },
        { name: 'Retenção', data: history.map(h => h.retentionRate) }
    ]

    const TrendBadge = ({ change, suffix = "", inverse = false }) => {
        if (change === 0) return <span className="text-muted font-size-11">Sem alteração</span>
        const isPositive = change > 0
        const isGood = inverse ? !isPositive : isPositive
        return (
            <span className={`font-size-11 fw-bold text-${isGood ? 'success' : 'danger'}`}>
                <i className={`mdi mdi-arrow-${isPositive ? 'up' : 'down'} me-1`}></i>
                {isPositive ? '+' : ''}{change}{suffix}
            </span>
        )
    }

    return (
        <div className="staff-metrics animate__animated animate__fadeIn">
            {/* Header com Ações */}
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                    <h5 className="mb-1 fw-bold text-dark">Dashboard de Desempenho</h5>
                    <p className="text-muted mb-0 font-size-12">
                        Referência: <span className="fw-bold">{metrics.period}</span>
                    </p>
                </div>
                <button className="btn btn-sm btn-soft-primary px-3 fw-medium" onClick={refresh} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : <><i className="mdi mdi-refresh me-1"></i> Atualizar Dados</>}
                </button>
            </div>

            <Row className="match-height">
                {/* Coluna da Esquerda: Gráfico de Evolução */}
                <Col lg={8} className="mb-4">
                    <Card className="border-0 shadow-sm h-100 mb-0">
                        <CardBody className="d-flex flex-column">
                            <h6 className="card-title mb-4 fw-bold d-flex align-items-center">
                                <i className="mdi mdi-chart-bar text-primary me-2 font-size-18"></i>
                                Indicadores de Evolução (%)
                            </h6>
                            <div className="flex-grow-1">
                                <ReactApexChart
                                    options={barChartOptions}
                                    series={barChartSeries}
                                    type="bar"
                                    height={360}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Coluna da Direita: Resumo de Valores Absolutos */}
                <Col lg={4} className="mb-4">
                    <Card className="border-0 shadow-sm h-100 mb-0">
                        <CardBody className="d-flex flex-column">
                            <h6 className="card-title mb-4 fw-bold d-flex align-items-center">
                                <i className="mdi mdi-clipboard-text-outline text-primary me-2 font-size-18"></i>
                                Resumo Operacional
                            </h6>

                            <div className="table-responsive flex-grow-1">
                                <Table className="table-nowrap mb-0 table-borderless align-middle">
                                    <tbody>
                                        <tr>
                                            <td className="ps-0 py-3">
                                                <div className="text-muted font-size-13 mb-1">Alunos Regulares</div>
                                                <h5 className="mb-0 fw-bold text-dark">{current.summary.activeRegularStudents}</h5>
                                            </td>
                                            <td className="text-end py-3">
                                                <TrendBadge change={comparatives.studentsChange} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-0 py-3">
                                                <div className="text-muted font-size-13 mb-1">Crescimento (Novos)</div>
                                                <h5 className="mb-0 fw-bold text-success">+{current.summary.newStudents}</h5>
                                            </td>
                                            <td className="text-end py-3 text-muted font-size-11">Este mês</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-0 py-3">
                                                <div className="text-muted font-size-13 mb-1">Evasão (Churn)</div>
                                                <h5 className="mb-0 fw-bold text-danger">-{current.summary.cancelledStudents}</h5>
                                            </td>
                                            <td className="text-end py-3 text-muted font-size-11">Este mês</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-0 py-3">
                                                <div className="text-muted font-size-13 mb-1">Aulas Realizadas</div>
                                                <h5 className="mb-0 fw-bold text-dark">{current.summary.totalSessions}</h5>
                                            </td>
                                            <td className="text-end py-3 text-muted font-size-11">
                                                {current.summary.sessionsWithAttendance} listas
                                            </td>
                                        </tr>
                                        <tr className="border-top border-light">
                                            <td className="ps-0 py-3" colSpan="2">
                                                <div className="text-muted font-size-13 mb-2">Utilização da Grade</div>
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <span className="fw-bold text-dark font-size-15">{current.summary.totalEnrolled} / {current.summary.totalCapacity}</span>
                                                    <span className="badge bg-soft-primary text-primary">{current.metrics.occupancyRate}%</span>
                                                </div>
                                                <div className="progress progress-sm" style={{ height: '6px' }}>
                                                    <div
                                                        className="progress-bar bg-primary rounded-pill"
                                                        role="progressbar"
                                                        style={{ width: `${current.metrics.occupancyRate}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Footer Informativo */}
            <div className="bg-soft-light p-3 rounded border border-dashed text-muted mt-2 shadow-sm">
                <div className="d-flex align-items-center">
                    <div className="avatar-xs me-3">
                        <span className="avatar-title rounded-circle bg-primary text-white font-size-14">
                            <i className="mdi mdi-lightbulb-on-outline"></i>
                        </span>
                    </div>
                    <div>
                        <p className="mb-0 font-size-12 lh-base">
                            <strong>Dica de Análise:</strong> A <strong>Retenção</strong> é calculada excluindo o efeito das novas matrículas, medindo apenas a fidelidade da base que já estava com o professor.
                            Procure manter a <strong>Ocupação</strong> acima de 80% para garantir a sustentabilidade das turmas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StaffMetrics
