import React from "react";
import { Row, Col, Card, CardBody, Table, Badge } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { usePerformanceMonitoring } from "../Hooks/usePerformanceMonitoring";

const PerformanceDashboard = () => {
    const { performanceLogs, loading, stats } = usePerformanceMonitoring();

    const chartOptions = {
        chart: {
            height: 350,
            type: 'donut',
        },
        labels: ["Bom (<800ms)", "Médio (800-2000ms)", "Lento (>2000ms)"],
        colors: ["#34c38f", "#f1b44c", "#f46a6a"],
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    const series = [stats.good, stats.average, stats.slow];

    if (loading) return <div>Carregando métricas...</div>;

    return (
        <React.Fragment>
            <Row className="mt-4">
                <Col xl="4">
                    <Card>
                        <CardBody>
                            <h4 className="card-title mb-4">Saúde do Sistema</h4>
                            <ReactApexChart
                                options={chartOptions}
                                series={series}
                                type="donut"
                                height={320}
                                className="apex-charts"
                            />
                            <div className="text-center mt-4">
                                <h5>Tempo Médio: <span className="text-primary">{stats.avgDuration}ms</span></h5>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col xl="8">
                    <Card>
                        <CardBody>
                            <h4 className="card-title mb-4">Últimas Execuções (Cloud Functions)</h4>
                            <div className="table-responsive">
                                <Table className="table-centered table-nowrap mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Função</th>
                                            <th>Duração</th>
                                            <th>Status</th>
                                            <th>Categoria</th>
                                            <th>Data/Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performanceLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{log.functionName}</td>
                                                <td>{log.duration}ms</td>
                                                <td>
                                                    <Badge color={log.status === 'success' ? 'success' : 'danger'}>
                                                        {log.status === 'success' ? 'Sucesso' : 'Erro'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge
                                                        color={
                                                            log.category === 'good' ? 'success' :
                                                                log.category === 'average' ? 'warning' : 'danger'
                                                        }
                                                        pill
                                                    >
                                                        {log.category.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td>{log.timestamp?.toLocaleString() || '-'}</td>
                                            </tr>
                                        ))}
                                        {performanceLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center">Nenhum dado capturado ainda.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default PerformanceDashboard;
