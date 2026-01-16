import React from "react"
import ReactApexChart from "react-apexcharts"

const DonutChart = () => {
    const chartOptions = {
        options: {
          chart: {
            type: 'donut',
          },
          colors: ['#8E7CC3', '#29B6F6','#E0E0E0'], // Colors for each slice
          dataLabels: {
            enabled: false,
            formatter: function (val, opts) {
              return opts.w.globals.labels[opts.seriesIndex];
            },
            style: {
              fontSize: '14px',
              colors: ['#000'],
            },
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
                    label: 'In-Store Sales',
                    formatter: () => '30', // Total sales number to display
                  },
                },
              },
            },
          },
        },
      };
    
  const series = [35, 20, 10]
  return (
    <React.Fragment>
      <ReactApexChart
        options={chartOptions.options}
        series={series}
        type="donut"
        height="300"
      />
    </React.Fragment>
  )
}

export default DonutChart
