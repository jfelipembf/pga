import React, { useMemo } from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import MonthlyEarnings from "../montly-earnings"
import Crescimento from "../crescimento"
import YearlySales from "../yearly-sales"
import TaskDashboard from "../Tasks/TaskDashboard"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
import PageLoader from "../../../components/Common/PageLoader"
import { formatCurrency } from "../../../utils/format"

const ManagementDashboard = () => {
    document.title = "Dashboard Gerencial | PGA Admin"

    const { loading, data } = useGeneralDashboard('manager')

    const reports = useMemo(() => {
        if (!data) return [
            { title: "Alunos Ativos", iconClass: "account-group", total: "...", growth: 0, desc: " vs mês passado" },
            { title: "Receita Total", iconClass: "cash", total: "...", growth: 0, desc: " vs mês passado" },
            { title: "Ticket Médio", iconClass: "cash-multiple", total: "...", growth: 0, desc: " vs mês passado" },
            { title: "Novos Alunos", iconClass: "account-plus", total: "...", growth: 0, desc: " vs mês passado" }
        ]

        return [
            {
                title: "Alunos Ativos",
                iconClass: "account-group",
                total: data.students?.active || 0,
                growth: data.studentsGrowth?.active,
                desc: " vs mês passado"
            },
            {
                title: "Receita Total",
                iconClass: "cash",
                total: formatCurrency(data.sales?.month || 0),
                growth: data.sales?.growth,
                desc: " vs mês passado"
            },
            {
                title: "Ticket Médio",
                iconClass: "cash-multiple",
                total: formatCurrency(data.sales?.ticket || 0),
                desc: " média por venda"
            },
            {
                title: "Novos Alunos",
                iconClass: "account-plus",
                total: data.students?.new || 0,
                growth: data.studentsGrowth?.new,
                desc: " no mês atual"
            }
        ]
    }, [data])

    if (loading) {
        return <PageLoader />
    }

    // Filtramos para pegar os últimos 2 anos (Anterior e Atual) para o gráfico solicitado
    const seriesStudents = data?.charts?.seriesStudents?.slice(-2) || []

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Miniwidget reports={reports} colSize={3} />

            <Row className="mt-4">
                {/* Monthly Earnings - Mais vendidos */}
                <Col xl={3}>
                    <MonthlyEarnings data={data?.charts?.mostSold} />
                </Col>

                {/* Crescimento Financeiro */}
                <Col xl={6}>
                    <Crescimento data={data?.charts?.growthHistory} />
                </Col>

                {/* Yearly Sales - Alunos Ativos */}
                <Col xl={3}>
                    <YearlySales
                        title="Alunos Ativos - Comparativo"
                        series={seriesStudents}
                        colors={['#D1D5DB', '#34c38f']}
                        height="300"
                    >
                        <Row className="text-center">
                            <Col xs="6">
                                <h5 className="font-size-20">{data?.students?.active || 0}</h5>
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
            </Row>

            <Row className="mt-4">
                {/* Gestão de Tarefas - Novo Componente */}
                <Col xl={12}>
                    <TaskDashboard />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default ManagementDashboard
