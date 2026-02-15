import React, { Component } from "react";
import { Card, CardBody, Row, Col } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";

class YearlySales extends Component {
    constructor(props) {
        super(props);

        this.state = {
            options: {
                colors: ["#28bbe3", "#F0F1F4"],
                chart: {
                    toolbar: {
                        show: false,
                    },
                    sparkline: {
                        enabled: true,
                    },
                },
                plotOptions: {
                    bar: {
                        columnWidth: "45%",
                    },
                },
                xaxis: {
                    categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                    crosshairs: {
                        width: 1,
                    },
                },
                tooltip: {
                    fixed: {
                        enabled: false,
                    },
                    x: {
                        show: true,
                    },
                    y: {
                        formatter: function (val) {
                            return val + " Ativos";
                        },
                        title: {
                            formatter: function (seriesName) {
                                return "";
                            },
                        },
                    },
                    marker: {
                        show: false,
                    },
                },
            },
            series: [
                {
                    data: [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54],
                },
            ],
        };
    }

    render() {
        const { activeCount, data } = this.props;

        return (
            <React.Fragment>
                <Card className="h-100">
                    <CardBody>
                        <h4 className="card-title mb-4">Alunos ativos</h4>
                        <Row>
                            <Col md="4">
                                <div>
                                    <h3>{activeCount !== undefined ? activeCount.toLocaleString('pt-BR') : "0"}</h3>
                                    <p className="text-muted">Seus alunos ativos nos últimos meses</p>
                                    <Link to="#" className="text-primary">Ver mais <i className="mdi mdi-chevron-double-right"></i></Link>
                                </div>
                            </Col>
                            <Col md="8" className="text-end">
                                <div id="sparkline">
                                    <ReactApexChart
                                        options={this.state.options}
                                        series={data || this.state.series}
                                        type="bar"
                                        height="130"
                                        className="apex-charts"
                                    />
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

export default YearlySales;