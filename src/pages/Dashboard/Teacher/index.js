import React, { useMemo } from "react"
import { Row, Col, Card, CardBody, CardTitle, Table, Badge } from "reactstrap"
import Miniwidget from "../Miniwidget"
import { useTeacherDashboard } from "../hooks/useTeacherDashboard"
import TaskSummaryList from "../Tasks/TaskSummaryList"
import ReactApexChart from "react-apexcharts"
import { useAuth } from "../../../hooks/useAuth"
import moment from "moment"
import PageLoader from "../../../components/Common/PageLoader"

const TeacherDashboard = () => {
    document.title = "Dashboard Professor | PGA Admin"

    const { user } = useAuth()
    const { data, loading } = useTeacherDashboard()

    const reports = useMemo(() => {
        return [
            {
                title: "Turmas Ativas",
                iconClass: "school",
                total: loading ? "..." : (data?.kpi?.activeClasses || 0),
                desc: "Turmas sob sua responsabilidade"
            },
            {
                title: "Capacidade Total",
                iconClass: "account-multiple-outline",
                total: loading ? "..." : (data?.kpi?.maxCapacity || 0),
                desc: "Vagas totais nas turmas"
            },
            {
                title: "Ocupação Média",
                iconClass: "percent",
                total: loading ? "..." : `${(data?.kpi?.occupancyRate || 0).toFixed(1)}%`,
                growth: loading ? 0 : (data?.kpi?.occupancyRate >= 70 ? 1 : (data?.kpi?.occupancyRate < 30 ? -1 : 0)),
                desc: loading ? "Calculando..." : `${data?.kpi?.activeStudents || 0} alunos matriculados`
            },
            {
                title: "Conversão (Exp -> Mat)",
                iconClass: "chart-line",
                total: loading ? "..." : `${(data?.kpi?.conversionRate || 0).toFixed(1)}%`,
                desc: loading ? "Buscando..." : `${data?.kpi?.conversionTotal || 0} convertidos de ${data?.kpi?.experimentalTotal || 0}`
            }
        ]
    }, [data, loading])

    if (loading) {
        return <PageLoader />
    }

    const chartOptions = {
        chart: {
            height: 350,
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '45%',
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: data?.charts?.weeklyOccupancy?.labels || ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            title: { text: 'Ocupação (%)' },
            max: 100
        },
        fill: { opacity: 1 },
        colors: ['#34c38f'],
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%"
                }
            }
        }
    }

    const chartSeries = [{
        name: 'Ocupação',
        data: data?.charts?.weeklyOccupancy?.series || []
    }]


    // Incremental loading

    return (
        <React.Fragment>
            {/* Cards de Métricas (KPIs) */}
            <Miniwidget reports={reports} colSize={3} />

            <Row className="mt-4">
                {/* Lista de Aulas Experimentais Próximas */}
                <Col lg={6}>
                    <Card className="h-100">
                        <CardBody>
                            <CardTitle className="mb-4">Próximas Aulas Experimentais</CardTitle>

                            {/* Tabela Simplificada */}
                            <div className="table-responsive">
                                <Table className="table-centered table-nowrap mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Data/Hora</th>
                                            <th>Aluno</th>
                                            <th>Turma</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.lists?.upcomingExperimentals?.length > 0 ? (
                                            data.lists.upcomingExperimentals.map((item, key) => (
                                                <tr key={key}>
                                                    <td>
                                                        <h6 className="mb-0">{moment(item.sessionDate).format("DD/MM")}</h6>
                                                        <small className="text-muted">{item.startTime}</small>
                                                    </td>
                                                    <td>{item.studentName}</td>
                                                    <td>{item.className}</td>
                                                    <td>
                                                        <Badge color="warning" pill>
                                                            {item.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center text-muted py-4">
                                                    Nenhuma aula experimental agendada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Minhas Tarefas */}
                <Col lg={6}>
                    <TaskSummaryList
                        title="Minhas Tarefas Pendentes"
                        filters={{ assignedTo: user?.uid }}
                    />
                </Col>
            </Row>

            <Row className="mt-4">
                {/* Gráfico de Lotação Semanal */}
                <Col lg={6}>
                    <Card className="h-100">
                        <CardBody>
                            <CardTitle className="mb-4">Lotação Média por Dia da Semana</CardTitle>
                            <ReactApexChart
                                options={chartOptions}
                                series={chartSeries}
                                type="bar"
                                height={350}
                            />
                        </CardBody>
                    </Card>
                </Col>

                {/* Histórico de Renovações */}
                <Col lg={6}>
                    <Card className="h-100">
                        <CardBody>
                            <CardTitle className="mb-4">Histórico de Renovações (Últimos 6 meses)</CardTitle>
                            {data?.charts?.renewalHistory && (
                                <ReactApexChart
                                    options={{
                                        chart: {
                                            id: 'renewal-history',
                                            toolbar: { show: false },
                                            zoom: { enabled: false }
                                        },
                                        plotOptions: {
                                            bar: {
                                                horizontal: false,
                                                columnWidth: '55%',
                                                endingShape: 'rounded'
                                            },
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            show: true,
                                            width: [0, 0, 2],
                                            colors: ['transparent', 'transparent', '#556ee6']
                                        },
                                        xaxis: {
                                            categories: data.charts.renewalHistory.labels || [],
                                        },
                                        yaxis: [
                                            {
                                                title: { text: 'Alunos' }
                                            },
                                            {
                                                opposite: true,
                                                title: { text: 'Taxa (%)' }
                                            }
                                        ],
                                        fill: {
                                            opacity: 1
                                        },
                                        colors: ['#f46a6a', '#34c38f', '#556ee6'], // Vencidos (Red), Renovados (Green), Taxa (Blue)
                                        tooltip: {
                                            y: {
                                                formatter: function (val, { seriesIndex, w }) {
                                                    // Verificação de segurança para seriesIndex
                                                    if (seriesIndex === 2) return val + "%";
                                                    return val + " alunos";
                                                }
                                            }
                                        }
                                    }}
                                    series={[
                                        {
                                            name: 'Vencidos',
                                            type: 'column',
                                            data: data.charts.renewalHistory.series[0]?.data || []
                                        },
                                        {
                                            name: 'Renovados',
                                            type: 'column',
                                            data: data.charts.renewalHistory.series[1]?.data || []
                                        },
                                        {
                                            name: 'Taxa de Conversão',
                                            type: 'line',
                                            data: data.charts.renewalHistory.series[2]?.data || []
                                        }
                                    ]}
                                    type="line"
                                    height={350}
                                />
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment >
    )
}

export default TeacherDashboard
