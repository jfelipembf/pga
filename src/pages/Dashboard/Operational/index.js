import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import Miniwidget from "../Miniwidget"
import YearlyComparisonChart from "../montly-earnings2"

const OperationalDashboard = () => {
    document.title = "Dashboard Operacional | PGA Admin"

    // Dados mockados - serão conectados depois
    const reports = [
        {
            title: "Minhas Vendas (Hoje)",
            iconClass: "cash-multiple",
            total: "R$ 1.250,00",
            growth: 15.2,
            desc: " vs ontem"
        },
        {
            title: "Minhas Vendas (Mês)",
            iconClass: "calendar-month",
            total: "R$ 24.500,00",
            growth: 8.5,
            desc: " vs mês passado"
        },
        {
            title: "Meus Alunos Ativos",
            iconClass: "account-group",
            total: "42",
            growth: 5.0,
            desc: " vs mês passado"
        },
        {
            title: "Novos Alunos (Mês)",
            iconClass: "account-plus",
            total: "8",
            growth: 12.5,
            desc: " vs mês passado"
        },
        {
            title: "Aulas Experimentais",
            iconClass: "calendar-check",
            total: "5",
            desc: " agendadas esta semana"
        },
        {
            title: "Tarefas Pendentes",
            iconClass: "format-list-checks",
            total: "12",
            desc: " para hoje"
        }
    ]

    // Mock de tarefas do dia
    const todayTasks = [
        { id: 1, time: "09:00", title: "Ligar para João - Follow-up venda", priority: "high" },
        { id: 2, time: "10:30", title: "Acompanhar Maria - Primeira aula", priority: "medium" },
        { id: 3, time: "14:00", title: "Receber Pedro - Aula experimental", priority: "high" },
        { id: 4, time: "16:00", title: "Confirmar presença - Turma das 17h", priority: "low" },
        { id: 5, time: "17:30", title: "Fechar caixa do dia", priority: "high" }
    ]

    // Mock de vendas recentes
    const recentSales = [
        { id: 1, client: "Ana Silva", value: "R$ 450,00", time: "Há 2 horas", type: "Matrícula" },
        { id: 2, client: "Carlos Santos", value: "R$ 300,00", time: "Há 4 horas", type: "Renovação" },
        { id: 3, client: "Beatriz Costa", value: "R$ 500,00", time: "Ontem", type: "Matrícula" }
    ]

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'danger'
            case 'medium': return 'warning'
            case 'low': return 'info'
            default: return 'secondary'
        }
    }

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Miniwidget reports={reports} colSize={4} />

            <Row className="mt-4">
                {/* Tarefas do Dia */}
                <Col lg={6}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar-sm me-3">
                                    <span className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary">
                                        <i className="mdi mdi-format-list-checks font-size-24"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="mb-1">Minhas Tarefas de Hoje</h5>
                                    <p className="text-muted mb-0 small">Organize seu dia</p>
                                </div>
                            </div>

                            <div className="task-list">
                                {todayTasks.map(task => (
                                    <div key={task.id} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                                        <div className="form-check me-3">
                                            <input className="form-check-input" type="checkbox" id={`task-${task.id}`} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1">{task.title}</h6>
                                                    <small className="text-muted">
                                                        <i className="mdi mdi-clock-outline me-1"></i>
                                                        {task.time}
                                                    </small>
                                                </div>
                                                <span className={`badge bg-${getPriorityColor(task.priority)} badge-sm`}>
                                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-3">
                                <button className="btn btn-light btn-sm">
                                    <i className="mdi mdi-plus me-1"></i>
                                    Nova Tarefa
                                </button>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Vendas Recentes */}
                <Col lg={6}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar-sm me-3">
                                    <span className="avatar-title rounded-circle bg-success bg-opacity-10 text-success">
                                        <i className="mdi mdi-cash-multiple font-size-24"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="mb-1">Minhas Vendas Recentes</h5>
                                    <p className="text-muted mb-0 small">Últimas transações</p>
                                </div>
                            </div>

                            <div className="sales-list">
                                {recentSales.map(sale => (
                                    <div key={sale.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                        <div className="avatar-xs me-3">
                                            <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                {sale.client.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{sale.client}</h6>
                                            <small className="text-muted">{sale.type} • {sale.time}</small>
                                        </div>
                                        <div className="text-end">
                                            <h6 className="mb-0 text-success">{sale.value}</h6>
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
            </Row>

            {/* Gráfico de Performance */}
            <Row className="mt-4">
                <Col lg={12}>
                    <YearlyComparisonChart
                        title="Minhas Vendas - Últimos 12 Meses"
                        series={[
                            {
                                name: 'Vendas',
                                data: [5000, 7000, 6500, 8000, 7200, 9500, 8800, 10200, 9800, 11500, 10800, 12400]
                            }
                        ]}
                        colors={['#556ee6']}
                        tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default OperationalDashboard
