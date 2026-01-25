import React from "react"
import {
    Col,
    Row,
    Card,
    CardBody,
    CardHeader,
    Table
} from "reactstrap"
import Miniwidget from "../../../components/Dashbooard/Miniwidget"
import ReactApexChart from "react-apexcharts"
import { formatCurrency } from "../../Dashboard/Utils/dashboardUtils"
import { useFinancialDashboardLogic } from "./Hooks/useFinancialDashboardLogic"
import PageLoader from "../../../components/Common/PageLoader"

const FinancialDashboardContent = ({ data }) => {
    const { reports, forecast, revenueHistory } = data || { reports: [], forecast: [], revenueHistory: [] }

    const revenueChartOptions = {
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 4
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        colors: ["#3c5068", "#11c46e"],
        xaxis: {
            categories: revenueHistory.map(h => h.month),
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 3
        },
        fill: { opacity: 1 },
        tooltip: {
            y: {
                formatter: (val) => formatCurrency(val)
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        }
    }

    const revenueSeries = [
        { name: 'Bruto', data: revenueHistory.map(h => h.gross) },
        { name: 'Líquido', data: revenueHistory.map(h => h.net) }
    ]

    return (
        <React.Fragment>
            <Miniwidget reports={reports || []} />

            <Row className="g-4 mt-1">
                <Col xl={8}>
                    <Card className="shadow-sm border-0">
                        <CardHeader className="bg-transparent border-0 pt-3 ps-3">
                            <h4 className="card-title mb-0">Histórico de Receita (Bruto vs Líquido)</h4>
                        </CardHeader>
                        <CardBody>
                            <ReactApexChart
                                options={revenueChartOptions}
                                series={revenueSeries}
                                type="bar"
                                height={350}
                            />
                        </CardBody>
                    </Card>
                </Col>

                <Col xl={4}>
                    <Card className="shadow-sm border-0 h-100">
                        <CardHeader className="bg-transparent border-0 pt-3 ps-3">
                            <h4 className="card-title mb-0">Próximos Recebimentos</h4>
                        </CardHeader>
                        <CardBody>
                            <p className="text-muted small mb-3">Valores previstos para entrar no caixa baseados em vencimentos futuros.</p>
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Mês</th>
                                            <th className="text-end">Valor Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {forecast.map((f, idx) => (
                                            <tr key={idx}>
                                                <td>{f.month}</td>
                                                <td className="text-end fw-semibold text-success">{formatCurrency(f.amount)}</td>
                                            </tr>
                                        ))}
                                        {forecast.length === 0 && (
                                            <tr>
                                                <td colSpan="2" className="text-center text-muted py-4">Sem projeções para os próximos meses</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="mt-4 p-3 bg-light rounded border border-dashed text-center">
                                <p className="text-muted small mb-0">
                                    <i className="mdi mdi-information-outline me-1"></i>
                                    Projeção baseada em recebíveis em aberto e datas de crédito de cartões.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}


const FinancialDashboard = () => {
    const { isLoading, reports, revenueHistory, forecast, monthly } = useFinancialDashboardLogic()

    // Pass the fetched data to the content component
    const data = {
        reports,
        revenueHistory,
        forecast
    }

    if (isLoading('page') || !monthly) {
        return <PageLoader />
    }

    return <FinancialDashboardContent data={data} />
}

export default FinancialDashboard
