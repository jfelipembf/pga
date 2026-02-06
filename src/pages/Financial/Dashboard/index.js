import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import Miniwidget from "../../Dashboard/Miniwidget"
import { useFinancialDashboard } from "./hooks/useFinancialDashboard"
import { formatCurrency } from "../../../utils/format"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import PageLoader from "../../../components/Common/PageLoader"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const chartOptions = {
    responsive: true,
    plugins: {
        legend: { position: 'top', align: 'end' }, // Legenda à direita como na imagem? (Na imagem é "Total recebimentos | Meta gastos" centralizado)
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { borderDash: [2, 4], color: "#e9e9ef" } // Grid tracejado suave
        },
        x: {
            grid: { display: false }
        }
    },
    maintainAspectRatio: false
}

const FinancialDashboard = () => {
    document.title = "Dashboard Financeiro | Lexa Admin"

    const { data, chartData, loading } = useFinancialDashboard()

    if (loading) {
        return <PageLoader />
    }

    // KPIs Superiores
    const reports = [
        {
            title: "Inadimplência",
            iconClass: "alert-circle-outline", // Ícone de alerta
            total: formatCurrency(data.inadimplencia.amount),
            average: `${data.inadimplencia.count} títulos em atraso`,
            badgecolor: "danger" // Vermelho
        },
        {
            title: "Contas Vencidas",
            iconClass: "calendar-alert",
            total: formatCurrency(data.overduePayables.amount),
            average: `${data.overduePayables.count} contas vencidas`,
            badgecolor: "danger" // Vermelho
        },
        {
            title: "Saldo Disponível",
            iconClass: "wallet-outline",
            total: formatCurrency(data.balance.total),
            average: "Caixa + Bancos",
            badgecolor: "primary" // Azul
        }
    ]

    return (
        <React.Fragment>

            {/* Linha 1: KPIs (Miniwidgets) */}
            <Miniwidget reports={reports} colSize={4} />

            {/* Linha 2: Recebimentos e Gastos (Gráfico Grande) */}
            <Row>
                <Col lg={12}>
                    <Card className="shadow-sm">
                        <CardBody>
                            <div className="d-flex flex-wrap align-items-center mb-4">
                                <h4 className="card-title mb-0 me-4 text-uppercase font-size-16 fw-bold text-muted">Recebimentos e Gastos</h4>

                                <div className="d-flex gap-4 ms-auto">
                                    <div>
                                        <p className="text-muted mb-1 font-size-12 text-uppercase">Total Recebido</p>
                                        <h5 className="mb-0 text-success fw-bold font-size-20">{formatCurrency(data.performance.income)}</h5>
                                    </div>
                                    <div>
                                        <p className="text-muted mb-1 font-size-12 text-uppercase">Total Gasto</p>
                                        <h5 className="mb-0 text-danger fw-bold font-size-20">{formatCurrency(data.performance.expense)}</h5>
                                    </div>
                                    <div className="border-start ps-4">
                                        <p className="text-muted mb-1 font-size-12 text-uppercase">Resultado</p>
                                        <h5 className={`mb-0 fw-bold font-size-20 ${data.performance.balance >= 0 ? 'text-primary' : 'text-danger'}`}>
                                            {formatCurrency(data.performance.balance)}
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '350px' }}>
                                {chartData ? (
                                    <Line data={chartData} options={chartOptions} />
                                ) : (
                                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                        Carregando gráfico...
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

        </React.Fragment>
    )
}

export default FinancialDashboard
