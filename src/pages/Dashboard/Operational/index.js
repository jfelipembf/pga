import React, { useMemo } from "react"
import { Row, Col } from "reactstrap"
import Miniwidget from "../Miniwidget"
import { useGeneralDashboard } from "../hooks/useGeneralDashboard"
import TaskSummaryList from "../Tasks/TaskSummaryList"
import { useAuth } from "../../../hooks/useAuth"

const OperationalDashboard = () => {
    document.title = "Dashboard Operacional | PGA Admin"

    const { user } = useAuth()
    const { data, loading } = useGeneralDashboard('operational')

    const reports = useMemo(() => {
        return [
            {
                title: "Vendas (Hoje)",
                iconClass: "cash-multiple",
                total: loading ? "..." : `R$ ${(data?.mySalesToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                desc: "Total vendido hoje"
            },
            {
                title: "Vendas (Mês)",
                iconClass: "calendar-month",
                total: loading ? "..." : `R$ ${(data?.mySalesMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                desc: "Acumulado do mês"
            },
            {
                title: "Tarefas",
                iconClass: "format-list-checks",
                total: loading ? "..." : (data?.tasksToday || 0).toString(),
                desc: "Agendadas para hoje"
            },
            {
                title: "Vencimentos",
                iconClass: "calendar-check",
                total: loading ? "..." : (data?.expirationsToday || 0).toString(),
                desc: "Contratos vencendo hoje"
            }
        ];
    }, [data, loading]);

    // Incremental loading: structure appears first

    return (
        <React.Fragment>
            {/* Cards de Métricas */}
            <Miniwidget reports={reports} colSize={3} />

            <Row className="mt-4">
                {/* Tarefas do Dia */}
                <Col lg={12}>
                    <TaskSummaryList
                        title="Minhas Tarefas de Hoje"
                        filters={{ assignedTo: user?.uid }}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default OperationalDashboard
