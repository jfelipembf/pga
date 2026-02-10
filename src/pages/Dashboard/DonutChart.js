import React from "react"
import ReactApexChart from "react-apexcharts"

const DonutChart = ({ labels = [], series = [], totalLabel = "Janeiro", totalValue = "0" }) => {
  const chartOptions = {
    options: {
      chart: {
        type: 'donut',
      },
      labels: labels.length > 0 ? labels : ['Sem dados'],
      colors: ['#8E7CC3', '#29B6F6', '#E0E0E0', '#34c38f', '#f46a6a'], // Core Lexa-like colors
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'bottom',
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: totalLabel,
                formatter: () => totalValue,
              },
            },
          },
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + " vendas";
          }
        }
      }
    },
  };

  const finalSeries = series.length > 0 ? series : [0];

  return (
    <ReactApexChart
      options={chartOptions.options}
      series={finalSeries}
      type="donut"
      height="300"
    />
  )
}

export default DonutChart
