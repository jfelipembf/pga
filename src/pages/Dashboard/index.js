import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import Miniwidget from "./Miniwidget"
import { useGeneralDashboard } from "./hooks/useGeneralDashboard"
import { formatCurrency } from "../../utils/format"
import PageLoader from "../../components/Common/PageLoader"

const Dashboard = () => {
  document.title = "Dashboard Geral | PGA Admin"

  const { loading, data } = useGeneralDashboard('manager')

  if (loading) {
    return <PageLoader />
  }

  // Organizando os 6 cards desejados: 3 em cima, 3 embaixo
  const reports = [
    // Topo: Foco em Vendas e Ativos Principais
    {
      title: "Vendas (Hoje)",
      iconClass: "point-of-sale",
      total: loading ? "..." : formatCurrency(data?.sales?.today || 0),
      average: "Diário",
      badgecolor: "primary"
    },
    {
      title: "Vendas (Mês)",
      iconClass: "calendar-month",
      total: loading ? "..." : formatCurrency(data?.sales?.month || 0),
      average: "Acumulado",
      badgecolor: "success"
    },
    {
      title: "Alunos Ativos",
      iconClass: "account-group",
      total: loading ? "..." : (data?.students?.active || 0),
      average: "Base Atual",
      badgecolor: "info"
    },
    // Baixo: Foco em Movimentação da Base
    {
      title: "Novas Matrículas",
      iconClass: "account-plus",
      total: loading ? "..." : (data?.students?.new || 0),
      average: "Este Mês",
      badgecolor: "success"
    },
    {
      title: "Cancelamentos",
      iconClass: "account-remove",
      total: loading ? "..." : (data?.students?.canceled || 0),
      average: "Churn Mês",
      badgecolor: "danger"
    },
    {
      title: "Suspensos",
      iconClass: "pause-circle-outline",
      total: loading ? "..." : (data?.students?.suspended || 0),
      average: "Trancados",
      badgecolor: "warning"
    }
  ];

  return (
    <React.Fragment>
      {/* 
          Exibindo os 6 cards com colSize=4. 
          O sistema de grid do Bootstrap automaticamente quebrará a linha a cada 3 cards (4+4+4 = 12).
      */}
      <Miniwidget reports={reports} colSize={4} />

      {/* Espaço para Gráficos Futuros */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <CardBody style={{ minHeight: '300px' }} className="d-flex align-items-center justify-content-center">
              <p className="text-muted">Gráficos de evolução da base em desenvolvimento...</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default Dashboard