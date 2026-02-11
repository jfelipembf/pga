import React from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import Crescimento from "../crescimento"
import YearlySales from "../yearly-sales"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
import PageLoader from "../../../components/Common/PageLoader"
import { formatCurrency } from "../../../utils/format"

const FinancialDashboard = () => {
    document.title = "Dashboard Financeiro | PGA Admin"

    const { loading, data } = useGeneralDashboard('manager')

    if (loading) {
        return <PageLoader />
    }

    // Incremental loading

    const reports = [
        {
            title: "Vendas Hoje",
            iconClass: "cash-plus",
            total: loading ? "..." : formatCurrency(data?.financial?.salesToday || 0),
            desc: " recebido hoje"
        },
        {
            title: "Receita (Mês)",
            iconClass: "cash-multiple",
            total: loading ? "..." : formatCurrency(data?.financial?.salesMonth || 0),
            desc: " acumulado no mês"
        },
        {
            title: "Despesas (Mês)",
            iconClass: "cash-minus",
            total: loading ? "..." : formatCurrency(data?.financial?.expensesMonth || 0),
            desc: " pago no mês"
        },
        {
            title: "Lucro Líquido",
            iconClass: "chart-line",
            total: loading ? "..." : formatCurrency(data?.financial?.profitMonth || 0),
            desc: " resultado do mês"
        },
        {
            title: "Contas a Pagar",
            iconClass: "file-document-alert",
            total: loading ? "..." : formatCurrency(data?.financial?.payablesPending || 0),
            desc: " total pendente"
        },
        {
            title: "Ticket Médio",
            iconClass: "ticket-percent",
            total: loading ? "..." : formatCurrency(data?.sales?.ticket || 0),
            desc: " média por venda"
        }
    ]

    const seriesSales = data?.charts?.seriesSales || [];
    const currentYearSeries = seriesSales[seriesSales.length - 1];
    const lastYearSeries = seriesSales[seriesSales.length - 2];

    const currentYearTotal = currentYearSeries?.data?.reduce((a, b) => a + b, 0) || 0;
    const lastYearTotal = lastYearSeries?.data?.reduce((a, b) => a + b, 0) || 0;

    const yearlyGrowth = lastYearTotal > 0 ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100 : (currentYearTotal > 0 ? 100 : 0);

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Row>
                <Miniwidget reports={reports} colSize={4} />
            </Row>

            {/* Crescimento Financeiro e Comparativo Anual */}
            <Row className="mt-4">
                <Col xl={8}>
                    <Crescimento data={data?.charts?.growthHistory} />
                </Col>

                <Col xl={4}>
                    <YearlySales
                        title="Vendas - Comparativo Anual"
                        series={seriesSales}
                        colors={['#D1D5DB', '#f1b44c', '#34c38f']}
                        height="300"
                    >
                        <Row className="text-center">
                            <Col xs={6}>
                                <h5 className="font-size-20">{loading ? "..." : formatCurrency(currentYearTotal)}</h5>
                                <p className="text-muted mb-0">Total {currentYearSeries?.name || 'Ano Atual'}</p>
                            </Col>
                            <Col xs={6}>
                                <h5 className={`font-size-20 ${yearlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {yearlyGrowth > 0 ? '+' : ''}{yearlyGrowth.toFixed(1)}%
                                </h5>
                                <p className="text-muted mb-0">Crescimento</p>
                            </Col>
                        </Row>
                    </YearlySales>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default FinancialDashboard
