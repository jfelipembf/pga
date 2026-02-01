import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = () => {
  const data = {
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
    ],
    datasets: [
      {
        label: "Sales Analytics",
        fill: true,
        lineTension: 0.5,
        backgroundColor: "rgba(85, 110, 230, 0.2)",
        borderColor: "#556ee6",
        pointBorderColor: "#556ee6",
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#556ee6",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: [65, 59, 80, 81, 56, 55, 40, 55, 30, 80],
      },
      {
        label: "Monthly Earnings",
        fill: true,
        lineTension: 0.5,
        backgroundColor: "rgba(235, 239, 242, 0.2)",
        borderColor: "#ebeff2",
        pointBorderColor: "#ebeff2",
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#ebeff2",
        pointHoverBorderColor: "#eef0f2",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: [80, 23, 56, 65, 23, 35, 85, 25, 92, 36],
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 20,
        max: 100,
        ticks: {
          stepSize: 10,
        },
      },
    },
  };

  return <Line width={474} height={300} data={data} options={options} />;
};

export default LineChart;
