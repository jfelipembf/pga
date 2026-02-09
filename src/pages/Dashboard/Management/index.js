import React from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import MonthlyEarnings from "../montly-earnings"
import Crescimento from "../crescimento"
import LatestOrders from "../latest-orders"
import YearlySales from "../yearly-sales"

const ManagementDashboard = () => {
    document.title = "Dashboard Gerencial | PGA Admin"

    // Dados mockados - serão conectados depois
    const reports = [
        {
            title: "Alunos Ativos",
            iconClass: "account-group",
            total: "1,587",
            growth: 11,
            desc: " vs mês passado"
        },
        {
            title: "Receita Total",
            iconClass: "cash",
            total: "R$ 46.782",
            growth: -29,
            desc: " vs mês passado"
        },
        {
            title: "Ticket Médio",
            iconClass: "cash-multiple",
            total: "R$ 285,90",
            growth: 0,
            desc: " vs mês passado"
        },
        {
            title: "Novos Alunos",
            iconClass: "account-plus",
            total: "1890",
            growth: 89,
            desc: " vs mês passado"
        }
    ]

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Miniwidget reports={reports} colSize={3} />

            <Row className="mt-4">
                {/* Monthly Earnings - Adaptado para Ganhos Mensais */}
                <Col xl={3}>
                    <MonthlyEarnings />
                </Col>

                {/* Crescimento - Gráfico de Receitas, Despesas e Lucro */}
                <Col xl={6}>
                    <Crescimento />
                </Col>

                {/* Yearly Sales - Adaptado para Crescimento */}
                <Col xl={3}>
                    <YearlySales />
                </Col>
            </Row>

            <Row className="mt-4">
                {/* Latest Orders - Adaptado para Últimas Atividades */}
                <Col xl={12}>
                    <LatestOrders />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default ManagementDashboard
