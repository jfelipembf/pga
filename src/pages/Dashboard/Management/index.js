import React from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import YearlySales from "../yearly-sales"
import TaskSummaryList from "../Tasks/TaskSummaryList"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
// PageLoader removed


const ManagementDashboard = () => {
    document.title = "Dashboard Gerencial | PGA Admin"

    const { loading, data } = useGeneralDashboard('manager')

    // reports useMemo removed as it's no longer used

    // Incremental loading: structure appears first

    // Filtramos para pegar os últimos 2 anos (Anterior e Atual) para o gráfico solicitado
    const seriesStudents = data?.charts?.seriesStudents?.slice(-2) || []

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            {/* Cards de Métricas - Linha 1 */}
            <Row>
                <Miniwidget reports={[
                    {
                        title: "Novos Alunos",
                        iconClass: "account-plus",
                        total: loading ? "..." : (data?.students?.new || 0),
                        growth: data?.studentsGrowth?.new,
                        desc: " no mês atual"
                    },
                    {
                        title: "Alunos Ativos",
                        iconClass: "account-group",
                        total: loading ? "..." : (data?.students?.active || 0),
                        growth: data?.studentsGrowth?.active,
                        desc: " total atual"
                    },
                    {
                        title: "Suspensos",
                        iconClass: "account-off",
                        total: loading ? "..." : (data?.students?.suspended || 0),
                        growth: data?.studentsGrowth?.suspended,
                        desc: " bloqueados temporariamente"
                    }
                ]} colSize={4} />
            </Row>

            {/* Cards de Métricas - Linha 2 */}
            <Row className="mt-4">
                <Miniwidget reports={[
                    {
                        title: "Cancelamentos",
                        iconClass: "account-remove",
                        total: loading ? "..." : (data?.students?.canceled || 0),
                        growth: data?.studentsGrowth?.canceled,
                        desc: " perdidos no mês"
                    },
                    {
                        title: "Churn Rate",
                        iconClass: "chart-timeline-variant",
                        total: loading ? "..." : (data?.students ? `${((data.students.canceled / (data.students.active + data.students.canceled || 1)) * 100).toFixed(1)}%` : "0%"),
                        desc: " taxa de perda"
                    },
                    {
                        title: "Renovações",
                        iconClass: "restore",
                        total: loading ? "..." : (data?.students?.renewals || 0),
                        growth: data?.studentsGrowth?.renewals,
                        desc: " renovados no mês"
                    }
                ]} colSize={4} />
            </Row>
            <Row className="mt-4">
                {/* Yearly Sales - Alunos Ativos */}
                <Col xl={4}>
                    <YearlySales
                        title="Alunos Ativos - Comparativo"
                        series={seriesStudents}
                        colors={['#D1D5DB', '#34c38f']}
                        height="300"
                    >
                        <Row className="text-center">
                            <Col xs="6">
                                <h5 className="font-size-20">{loading ? "..." : (data?.students?.active || 0)}</h5>
                                <p className="text-muted mb-0">Total Ativos</p>
                            </Col>
                            <Col xs="6">
                                <h5 className={`font-size-20 ${data?.studentsGrowth?.active >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {data?.studentsGrowth?.active > 0 ? '+' : ''}{data?.studentsGrowth?.active?.toFixed(1) || 0}%
                                </h5>
                                <p className="text-muted mb-0">Crescimento</p>
                            </Col>
                        </Row>
                    </YearlySales>
                </Col>

                <Col xl={8}>
                    <TaskSummaryList title="Tarefas da Unidade - Hoje" />
                </Col>
            </Row>
        </React.Fragment >
    )
}

export default ManagementDashboard
