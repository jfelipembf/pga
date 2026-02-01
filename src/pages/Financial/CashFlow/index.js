import React from "react"
import { Row, Col, Card, CardBody, CardTitle, Button, Badge } from "reactstrap"
import BasicTable from "../../../components/Common/BasicTable"
import Miniwidget from "../../Dashboard/Miniwidget"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useCashFlow } from "./hooks/useCashFlow"
import { formatCurrency } from "../../../utils/format"
import { formatDate } from "../../../utils/date"
import { PAYMENT_METHOD_LABELS } from "../../../utils/constants"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const chartOptions = {
    responsive: true,
    plugins: {
        legend: { position: 'top' },
    },
    scales: {
        y: { beginAtZero: true }
    }
}

const CashFlowPage = () => {
    document.title = "Fluxo de Caixa | Lexa Admin"

    const {
        transactions,
        loading,
        period,
        setPeriod,
        totals,
        chartData
    } = useCashFlow()

    const columns = React.useMemo(() => [
        {
            label: "Data",
            key: "date",
            render: (tx) => formatDate(tx.date)
        },
        {
            label: "Descrição",
            key: "description",
            render: (tx) => <span className="fw-semibold">{tx.description}</span>
        },
        {
            label: "Categoria",
            key: "category",
            render: (tx) => <Badge className="bg-primary bg-soft text-primary font-size-12 p-2">{tx.category || 'Geral'}</Badge>
        },
        {
            label: "Método",
            key: "method",
            render: (tx) => (
                <Badge color="primary" className="font-size-11 p-2">
                    {(PAYMENT_METHOD_LABELS[tx.method] || tx.method || '-').toUpperCase()}
                </Badge>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (tx) => (
                <div className={`text-end fw-bold ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                </div>
            )
        }
    ], []);

    if (loading && transactions.length === 0) return (
        <div className="p-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Carregando fluxo de caixa...</p>
        </div>
    )

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div className="mb-3 mb-md-0">
                    <h4 className="font-size-18 text-uppercase fw-bold m-0">Fluxo de Caixa</h4>
                    <p className="text-muted mb-0">Monitoramento de entradas e saídas operacionais</p>
                </div>

                <div>
                    <Button color="light" className="me-2 shadow-sm" active={period === 'day'} onClick={() => setPeriod('day')}>Hoje</Button>
                    <Button color="light" className="me-2 shadow-sm" active={period === 'week'} onClick={() => setPeriod('week')}>Semana</Button>
                    <Button color="primary" className="shadow-sm" active={period === 'month'} onClick={() => setPeriod('month')}>Mês</Button>
                </div>
            </div>

            {/* RESUMO (CARDS) */}
            <Miniwidget
                colSize={4}
                reports={[
                    { title: "Entradas", iconClass: "arrow-up-bold", total: formatCurrency(totals.income), average: "No período", badgecolor: "success" },
                    { title: "Saídas", iconClass: "arrow-down-bold", total: formatCurrency(totals.expense), average: "No período", badgecolor: "danger" },
                    { title: "Saldo Líquido", iconClass: "scale-balance", total: formatCurrency(totals.balance), average: "Resultado", badgecolor: "info" },
                ]} />

            {/* GRÁFICO */}
            <Row className="mb-4">
                <Col lg={12}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <CardTitle className="mb-4 fw-bold text-uppercase font-size-13 text-muted">Movimentação Financeira (Últimos 7 dias)</CardTitle>
                            <div style={{ height: '300px' }}>
                                <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* TABELA DE LANÇAMENTOS */}
            <Row>
                <Col lg={12}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <CardTitle className="fw-bold text-uppercase font-size-13 text-muted">Últimos Lançamentos</CardTitle>
                                <Button color="primary" size="sm" className="waves-effect waves-light shadow-sm">
                                    <i className="mdi mdi-plus me-1"></i> Adicionar Manual
                                </Button>
                            </div>
                            <BasicTable
                                columns={columns}
                                data={transactions}
                                loading={loading}
                                searchKeys={["description", "category", "method"]}
                                searchPlaceholder="Buscar lançamentos..."
                                hideNew={true}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default CashFlowPage
