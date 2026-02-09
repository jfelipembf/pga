import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import Miniwidget from "../Miniwidget"
import YearlyComparisonChart from "../montly-earnings2"

const FinancialDashboard = () => {
    document.title = "Dashboard Financeiro | PGA Admin"

    // Dados mockados - serão conectados depois
    const reports = [
        {
            title: "Receita (Mês)",
            iconClass: "cash-plus",
            total: "R$ 145.800,00",
            growth: 12.5,
            desc: " vs mês passado"
        },
        {
            title: "Despesas (Mês)",
            iconClass: "cash-minus",
            total: "R$ 68.400,00",
            growth: 5.2,
            desc: " vs mês passado"
        },
        {
            title: "Lucro Líquido",
            iconClass: "chart-line",
            total: "R$ 77.400,00",
            growth: 18.8,
            desc: " vs mês passado"
        },
        {
            title: "Margem de Lucro",
            iconClass: "percent",
            total: "53.1%",
            growth: 3.2,
            desc: " vs mês passado"
        },
        {
            title: "Contas a Receber",
            iconClass: "cash-clock",
            total: "R$ 42.300,00",
            desc: " em aberto"
        },
        {
            title: "Contas a Pagar",
            iconClass: "file-document-alert",
            total: "R$ 18.600,00",
            desc: " vencendo em 7 dias"
        }
    ]

    // Mock de receitas vs despesas
    const monthlyFinancials = [
        { month: "Jan", revenue: 125000, expenses: 62000, profit: 63000 },
        { month: "Fev", revenue: 132000, expenses: 65000, profit: 67000 },
        { month: "Mar", revenue: 128000, expenses: 64000, profit: 64000 },
        { month: "Abr", revenue: 138000, expenses: 66000, profit: 72000 },
        { month: "Mai", revenue: 145800, expenses: 68400, profit: 77400 }
    ]

    // Mock de distribuição de despesas
    const expenseCategories = [
        { category: "Folha de Pagamento", value: 38500, percentage: 56.3 },
        { category: "Aluguel", value: 12000, percentage: 17.5 },
        { category: "Equipamentos", value: 8200, percentage: 12.0 },
        { category: "Marketing", value: 5400, percentage: 7.9 },
        { category: "Outros", value: 4300, percentage: 6.3 }
    ]

    // Mock de contas a receber
    const receivables = [
        { client: "João Silva", value: "R$ 450,00", dueDate: "Hoje", status: "overdue" },
        { client: "Maria Santos", value: "R$ 890,00", dueDate: "Amanhã", status: "warning" },
        { client: "Pedro Costa", value: "R$ 1.200,00", dueDate: "Em 3 dias", status: "ok" },
        { client: "Ana Oliveira", value: "R$ 650,00", dueDate: "Em 5 dias", status: "ok" }
    ]

    // Mock de top categorias de receita
    const revenueCategories = [
        { name: "Mensalidades", value: 98500, percentage: 67.6 },
        { name: "Matrículas", value: 28300, percentage: 19.4 },
        { name: "Personal Trainer", value: 12500, percentage: 8.6 },
        { name: "Produtos", value: 6500, percentage: 4.4 }
    ]

    const getStatusColor = (status) => {
        switch (status) {
            case 'overdue': return 'danger'
            case 'warning': return 'warning'
            case 'ok': return 'success'
            default: return 'secondary'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'overdue': return 'alert-circle'
            case 'warning': return 'clock-alert'
            case 'ok': return 'check-circle'
            default: return 'circle'
        }
    }

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Miniwidget reports={reports} colSize={4} />

            {/* Gráficos Financeiros */}
            <Row className="mt-4">
                <Col lg={8}>
                    <YearlyComparisonChart
                        title="Receitas vs Despesas - Últimos 12 Meses"
                        series={[
                            {
                                name: 'Receitas',
                                data: [125000, 132000, 128000, 138000, 145800, 142000, 148500, 155000, 152000, 158000, 162000, 168000]
                            },
                            {
                                name: 'Despesas',
                                data: [62000, 65000, 64000, 66000, 68400, 70000, 72000, 74500, 73000, 75000, 77000, 79000]
                            },
                            {
                                name: 'Lucro Líquido',
                                data: [63000, 67000, 64000, 72000, 77400, 72000, 76500, 80500, 79000, 83000, 85000, 89000]
                            }
                        ]}
                        colors={['#34c38f', '#f46a6a', '#556ee6']}
                        tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <h5 className="mb-4">Distribuição de Receitas</h5>

                            <div className="revenue-distribution">
                                {revenueCategories.map((item, idx) => (
                                    <div key={idx} className="mb-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="font-size-13 fw-medium">{item.name}</span>
                                            <span className="font-size-13 text-success fw-medium">
                                                R$ {(item.value / 1000).toFixed(1)}k
                                            </span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div
                                                className="progress-bar bg-success"
                                                role="progressbar"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">{item.percentage}% do total</small>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Análise Detalhada */}
            <Row className="mt-4">
                <Col lg={6}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar-sm me-3">
                                    <span className="avatar-title rounded-circle bg-warning bg-opacity-10 text-warning">
                                        <i className="mdi mdi-cash-clock font-size-24"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="mb-1">Contas a Receber Próximas</h5>
                                    <p className="text-muted mb-0 small">Vencimentos nos próximos 7 dias</p>
                                </div>
                            </div>

                            <div className="receivables-list">
                                {receivables.map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{item.client}</h6>
                                            <small className="text-muted d-flex align-items-center">
                                                <i className={`mdi mdi-${getStatusIcon(item.status)} me-1 text-${getStatusColor(item.status)}`}></i>
                                                Vencimento: {item.dueDate}
                                            </small>
                                        </div>
                                        <div className="text-end">
                                            <h6 className={`mb-0 text-${getStatusColor(item.status)}`}>{item.value}</h6>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-3">
                                <button className="btn btn-light btn-sm">
                                    <i className="mdi mdi-eye me-1"></i>
                                    Ver Todas
                                </button>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar-sm me-3">
                                    <span className="avatar-title rounded-circle bg-danger bg-opacity-10 text-danger">
                                        <i className="mdi mdi-cash-minus font-size-24"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="mb-1">Distribuição de Despesas</h5>
                                    <p className="text-muted mb-0 small">Mês atual</p>
                                </div>
                            </div>

                            <div className="expense-distribution">
                                {expenseCategories.map((item, idx) => (
                                    <div key={idx} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{item.category}</h6>
                                            <div className="progress" style={{ height: '4px', width: '150px' }}>
                                                <div
                                                    className="progress-bar bg-danger"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="mb-0 fw-medium">R$ {(item.value / 1000).toFixed(1)}k</p>
                                            <small className="text-muted">{item.percentage}%</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* KPIs Complementares */}
            <Row className="mt-4">
                <Col lg={3}>
                    <Card className="shadow-sm border-0 border-start border-success border-4">
                        <CardBody>
                            <p className="text-muted mb-2 small">Ticket Médio</p>
                            <h4 className="mb-1">R$ 285,00</h4>
                            <small className="text-success">
                                <i className="mdi mdi-arrow-up"></i> +8.2% vs mês passado
                            </small>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={3}>
                    <Card className="shadow-sm border-0 border-start border-info border-4">
                        <CardBody>
                            <p className="text-muted mb-2 small">Taxa de Inadimplência</p>
                            <h4 className="mb-1">4.2%</h4>
                            <small className="text-success">
                                <i className="mdi mdi-arrow-down"></i> -1.5% vs mês passado
                            </small>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={3}>
                    <Card className="shadow-sm border-0 border-start border-warning border-4">
                        <CardBody>
                            <p className="text-muted mb-2 small">ROI Marketing</p>
                            <h4 className="mb-1">380%</h4>
                            <small className="text-success">
                                <i className="mdi mdi-arrow-up"></i> +25% vs mês passado
                            </small>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={3}>
                    <Card className="shadow-sm border-0 border-start border-primary border-4">
                        <CardBody>
                            <p className="text-muted mb-2 small">Projeção Anual</p>
                            <h4 className="mb-1">R$ 1.82M</h4>
                            <small className="text-primary">
                                <i className="mdi mdi-information"></i> Baseado em 12 meses
                            </small>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default FinancialDashboard
