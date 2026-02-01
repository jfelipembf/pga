import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const data = {
    labels: ["Desktops", "Tablets"],
    datasets: [
      {
        data: [300, 180],
        backgroundColor: ["#34c38f", "#ebeff2"],
        hoverBackgroundColor: ["#34c38f", "#ebeff2"],
        hoverBorderColor: "#fff",
      },
    ],
  };

  return (
    <div style={{ width: 474, height: 260, display: "flex", alignItems: "center", margin: "auto" }}>
      <Pie data={data} />
    </div>
  );
};

export default PieChart;
