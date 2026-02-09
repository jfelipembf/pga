import React from 'react';
import { Card, CardBody } from "reactstrap";
import ReactApexChart from 'react-apexcharts';

const YearlySales = ({ title, data, series, categories, colors, tooltipFormatter, height = "300", children }) => {
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
        <Card className="h-100">
            <CardBody>
                <h4 className="card-title mb-4">{title}</h4>

                {children && (
                    <div className="mb-4">
                        {children}
                    </div>
                )}

                <div id="chart">
                    <ReactApexChart options={options} series={chartSeries} type="bar" height={height} />
                </div>
            </CardBody>
        </Card>
    );
};

export default YearlySales;