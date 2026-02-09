import React, { Component } from 'react';
import { Row, Col, Card, CardBody } from "reactstrap";
import ReactApexChart from 'react-apexcharts';

class Crescimento extends Component {
    constructor(props) {
        super(props);

        this.state = {
            options: {
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
                    width: 0.1,
                },
                grid: {
                    borderColor: '#f8f8fa',
                    row: {
                        colors: ['transparent', 'transparent'],
                        opacity: 0.5
                    },
                },
                xaxis: {
                    categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                    axisBorder: {
                        show: false
                    },
                    axisTicks: {
                        show: false
                    }
                },
                legend: {
                    show: false
                },
                tooltip: {
                    y: {
                        formatter: function (val) {
                            return 'R$ ' + val.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            series: [
                {
                    name: 'Receitas',
                    data: [125, 132, 128, 138, 145, 142, 148, 155, 152, 158, 162, 168]
                },
                {
                    name: 'Despesas',
                    data: [62, 65, 64, 66, 68, 70, 72, 74, 73, 75, 77, 79]
                },
                {
                    name: 'Lucro',
                    data: [63, 67, 64, 72, 77, 72, 76, 80, 79, 83, 85, 89]
                }
            ],
        }
    }
    render() {
        return (
            <React.Fragment>
                <Card className="h-100">
                    <CardBody>
                        <h4 className="card-title mb-4">Crescimento Financeiro</h4>

                        <Row className="text-center mt-4">
                            <Col xs="4">
                                <h5 className="font-size-20 text-success">R$ 168.000</h5>
                                <p className="text-muted">Receitas (Dez)</p>
                            </Col>
                            <Col xs="4">
                                <h5 className="font-size-20 text-danger">R$ 79.000</h5>
                                <p className="text-muted">Despesas (Dez)</p>
                            </Col>
                            <Col xs="4">
                                <h5 className="font-size-20 text-primary">R$ 89.000</h5>
                                <p className="text-muted">Lucro (Dez)</p>
                            </Col>
                        </Row>

                        <div id="crescimento-chart" className="morris-charts morris-charts-height" dir="ltr">
                            <ReactApexChart options={this.state.options} series={this.state.series} type="area" height="300" />
                        </div>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

export default Crescimento;
