import React from 'react';
import { Card, CardBody, Row, Col } from "reactstrap";
import ReactApexChart from 'react-apexcharts';

const YearlySales = ({ title, data, series, categories, colors, tooltipFormatter }) => {
    const options = {
        chart: {
            toolbar: { show: false },
        },
        colors: colors || ['#28bbe3', '#F0F1F4', '#556ee6'],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: categories || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        },
        yaxis: {
            labels: {
                formatter: function (val) {
                    return val ? val.toFixed(0) : 0;
                }
            }
        },
        grid: {
            borderColor: '#f1f1f1',
        },
        fill: { opacity: 1 },
        tooltip: {
            y: {
                formatter: function (val) {
                    return tooltipFormatter ? tooltipFormatter(val) : (val ? val.toFixed(0) : 0);
                }
            }
        },
        legend: { show: true, position: 'top' }
    };

    const chartSeries = series || [{
        name: title,
        data: data || []
    }];

    return (
        <Card>
            <CardBody>
                <h4 className="card-title mb-4">{title} - Comparativo Anual</h4>
                <div id="chart">
                    <ReactApexChart options={options} series={chartSeries} type="bar" height="300" />
                </div>
            </CardBody>
        </Card>
    );
};

export default YearlySales;