import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import Miniwidget from "./Miniwidget"
import { useGeneralDashboard } from "./hooks/useGeneralDashboard"
import { formatCurrency } from "../../utils/format"
import PageLoader from "../../components/Common/PageLoader"

import YearlyComparisonChart from "./montly-earnings2"

const Dashboard = () => {
  document.title = "Dashboard Geral | PGA Admin"

  const { loading, data } = useGeneralDashboard('manager')

  if (loading) {
    return <PageLoader />
  }

  // Organizando os cards desejados: 3 por linha
  const reports = [
    {
      title: "Vendas (Mês)",
      iconClass: "calendar-month",
      total: loading ? "..." : formatCurrency(data?.sales?.month || 0),
      growth: data?.sales?.growth, // Comparativo calculado no backend
      desc: " vs mês passado"
    },
    {
      title: "Alunos Ativos",
      iconClass: "account-group",
      total: loading ? "..." : (data?.students?.active || 0),
      growth: data?.studentsGrowth?.active,
      desc: " vs mês passado"
    },
    {
      title: "Novas Matrículas",
      iconClass: "account-plus",
      total: loading ? "..." : (data?.students?.new || 0),
      growth: data?.studentsGrowth?.new,
      desc: " vs mês passado"
    },
    {
      title: "Renovações",
      iconClass: "autorenew",
      total: loading ? "..." : (data?.students?.renewals || 0),
      growth: data?.studentsGrowth?.renewals,
      desc: " vs mês passado"
    },
    {
      title: "Cancelamentos",
      iconClass: "account-remove",
      total: loading ? "..." : (data?.students?.canceled || 0),
      growth: data?.studentsGrowth?.canceled,
      // Para cancelamentos, crescimento positivo é ruim (danger), negativo é bom (success) - Ajustar lógica no Miniwidget futuramente se desejar cores invertidas
      desc: " vs mês passado"
    },
    {
      title: "Suspensos",
      iconClass: "pause-circle-outline",
      total: loading ? "..." : (data?.students?.suspended || 0),
      growth: data?.studentsGrowth?.suspended,
      desc: " vs mês passado"
    }
  ];

  return (
    <React.Fragment>
      {/* 
          Exibindo os cards com colSize=4. 
          O sistema de grid do Bootstrap automaticamente quebrará a linha a cada 3 cards (4+4+4 = 12).
      */}
      <Miniwidget reports={reports} colSize={4} />

      <Row className="mt-4">
        <Col lg={6}>
          <YearlyComparisonChart
            title="Alunos Ativos - Últimos 3 Anos"
            series={data?.charts?.seriesStudents || []}
            colors={['#34c38f', '#556ee6', '#f1b44c']}
          />
        </Col>
        <Col lg={6}>
          <YearlyComparisonChart
            title="Vendas - Últimos 3 Anos"
            series={data?.charts?.seriesSales || []}
            colors={['#556ee6', '#f1b44c', '#34c38f']}
            tooltipFormatter={formatCurrency}
          />
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default Dashboard