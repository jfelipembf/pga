import React from 'react';
import { Row, Col, Card, CardBody } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { formatCurrency } from "../../utils/format";

const Crescimento = ({ data }) => {
    const options = {
        colors: ['#34c38f', '#f46a6a', '#556ee6'],
        chart: {
            toolbar: {
                show: false,
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        grid: {
            borderColor: '#f8f8fa',
        },
        xaxis: {
            categories: data?.months || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return 'R$ ' + val.toLocaleString('pt-BR');
                }
            }
        }
    };

    const series = data?.series || [
        { name: 'Receitas', data: [] },
        { name: 'Despesas', data: [] },
        { name: 'Lucro', data: [] }
    ];

    const current = data?.currentMonth || { income: 0, expense: 0, profit: 0 };

    return (
        <Card className="h-100">
            <CardBody>
                <h4 className="card-title mb-4">Crescimento Financeiro</h4>

                <Row className="text-center mt-4">
                    <Col xs="4">
                        <h5 className="font-size-20 text-success">{formatCurrency(current.income)}</h5>
                        <p className="text-muted mb-0 text-truncate">Receitas</p>
                    </Col>
                    <Col xs="4">
                        <h5 className="font-size-20 text-danger">{formatCurrency(current.expense)}</h5>
                        <p className="text-muted mb-0 text-truncate">Despesas</p>
                    </Col>
                    <Col xs="4">
                        <h5 className="font-size-20 text-primary">{formatCurrency(current.profit)}</h5>
                        <p className="text-muted mb-0 text-truncate">Lucro</p>
                    </Col>
                </Row>

                <div className="mt-4" dir="ltr">
                    <ReactApexChart options={options} series={series} type="area" height="300" />
                </div>
            </CardBody>
        </Card>
    );
};

export default Crescimento;
