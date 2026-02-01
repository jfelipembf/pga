import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = () => {
  const data = {
    labels: ["Desktops", "Tablets"],
    datasets: [
      {
        data: [300, 210],
        backgroundColor: ["#556ee6", "#ebeff2"],
        hoverBackgroundColor: ["#556ee6", "#ebeff2"],
        hoverBorderColor: "#fff",
      },
    ],
  };

  return (
    <div style={{ width: 474, height: 260, display: "flex", alignItems: "center", margin: "auto" }}>
     <Doughnut width={474} height={260} data={data} />
    </div>
  );

};

export default DoughnutChart;
