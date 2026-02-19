import React from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import YearlySales from "../yearly-sales"
import WidgetUser from "../widget-user"
import LatestTransactions from "../latest-transactions"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
import PageLoader from "../../../components/Common/PageLoader"
import { useTenant } from "../../../hooks/useTenant"

const ManagementDashboard = () => {
    document.title = "Dashboard Gerencial | PGA Admin"

    const { tenantSlug, branchSlug } = useTenant()
    const { loading, data } = useGeneralDashboard('manager')

    if (loading) {
        return <PageLoader />
    }

    // Filtramos para pegar os últimos 2 anos para outros componentes se necessário
    // Mas aqui vamos focar no layout original solicitado

    return (
        <React.Fragment>
            {/* Cards de Métricas - Topo (4 por linha como solicitado antes) */}
            <Miniwidget reports={[
                {
                    title: "Novos Alunos",
                    iconClass: "account-plus",
                    total: loading ? "..." : (data?.clients?.new || 0),
                    growth: data?.clientsGrowth?.new,
                    desc: " no mês atual"
                },
                {
                    title: "Alunos Ativos",
                    iconClass: "account-group",
                    total: loading ? "..." : (data?.clients?.active || 0),
                    growth: data?.clientsGrowth?.active,
                    desc: " total atual"
                },
                {
                    title: "Cancelamentos",
                    iconClass: "account-remove",
                    total: loading ? "..." : (data?.clients?.canceled || 0),
                    growth: data?.clientsGrowth?.canceled,
                    desc: " perdidos no mês"
                },
                {
                    title: "Churn Rate",
                    iconClass: "chart-timeline-variant",
                    total: loading ? "..." : (data?.clients ? `${((data.clients.canceled / (data.clients.active + data.clients.canceled || 1)) * 100).toFixed(1)}%` : "0%"),
                    desc: " taxa de perda"
                }
            ]} colSize={3} />

            <Row className="mt-4 align-items-stretch">
                <Col xl={4} className="d-flex flex-column">
                    {/* Eles dois um acima do outro como solicitado */}
                    <div className="mb-0">
                        <WidgetUser />
                    </div>
                    <div className="flex-grow-1 d-flex flex-column">
                        <YearlySales
                            activeCount={loading ? "..." : (data?.clients?.active || 0)}
                            data={
                                data?.charts?.seriesclients
                                    ? [{
                                        name: 'Alunos',
                                        data: data.charts.seriesclients.find(s => s.name === new Date().getFullYear().toString())?.data || []
                                    }]
                                    : []
                            }
                        />
                    </div>
                </Col>

                <Col xl={8} className="d-flex flex-column">
                    <LatestTransactions
                        transactions={data?.recentContracts}
                        title="Últimas Matrículas"
                        tenantSlug={tenantSlug}
                        branchSlug={branchSlug}
                    />
                </Col>
            </Row>

        </React.Fragment>
    )
}

export default ManagementDashboard
