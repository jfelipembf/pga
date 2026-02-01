import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = () => {
  const data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Sales Analytics",
        backgroundColor: "rgba(52, 195, 143, 0.8)",
        borderColor: "rgba(52, 195, 143, 0.8)",
        borderWidth: 1,
        hoverBackgroundColor: "rgba(52, 195, 143, 0.9)",
        hoverBorderColor: "rgba(52, 195, 143, 0.9)",
        data: [65, 59, 81, 45, 56, 80, 50],
      },
    ],
  };

  const options = {
    scales: {
      x: {
        barPercentage: 0.4, // Adjusts the bar width
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar width={474} height={300} data={data} options={options} />;
};

export default BarChart;
