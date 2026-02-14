import React from 'react';
import { Row, Col, Card, CardBody, CardTitle } from 'reactstrap';
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
    responsive: true,
    plugins: {
        legend: { position: 'top' },
    },
    scales: {
        y: { beginAtZero: true }
    }
};

export const CashFlowChart = ({ chartData }) => {
    return (
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
    );
};
