import React from "react"
import { Row, Col, Card, CardBody, CardTitle } from "reactstrap"
import Miniwidget from "../../Dashboard/Miniwidget"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
import { formatCurrency } from "../../../utils/format"

const OperationalDashboard = () => {
    document.title = "Dashboard Operacional | PGA Admin"

    const { loading, data } = useGeneralDashboard('operational')

    const reports = [
        {
            title: "Minhas Vendas (Hoje)",
            iconClass: "cart-plus",
            total: loading ? "..." : formatCurrency(data?.mySalesToday || 0),
            average: "Diário",
            badgecolor: "primary"
        },
        {
            title: "Minhas Vendas (Mês)",
            iconClass: "calendar-check",
            total: loading ? "..." : formatCurrency(data?.mySalesMonth || 0),
            average: "Acumulado",
            badgecolor: "success"
        },
        {
            title: "Minha Meta",
            iconClass: "bullseye-arrow",
            total: "0%", // Mock
            average: "Progresso",
            badgecolor: "warning"
        }
    ]

    return (
        <React.Fragment>

            <Miniwidget reports={reports} colSize={4} />

            <Row>
                <Col lg={6}>
                    <Card>
                        <CardBody>
                            <CardTitle className="mb-4">Aniversariantes do Dia</CardTitle>
                            <p className="text-muted text-center py-4">Nenhum aniversariante hoje.</p>
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card>
                        <CardBody>
                            <CardTitle className="mb-4">Tarefas Pendentes</CardTitle>
                            <p className="text-muted text-center py-4">Nenhuma tarefa pendente.</p>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default OperationalDashboard
