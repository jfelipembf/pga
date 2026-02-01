import React from "react";
import { PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
} from "chart.js";

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale);

const PolarChart = () => {
  const data = {
    datasets: [
      {
        data: [11, 16, 7, 18],
        backgroundColor: ["#f46a6a", "#34c38f", "#f1b44c", "#556ee6"],
        label: "My dataset", // for legend
        hoverBorderColor: "#fff",
      },
    ],
    labels: ["Series 1", "Series 2", "Series 3", "Series 4"],
  };
  return (
    <div style={{ width: 474, height: 300, display: "flex", alignItems: "center", margin: "auto" }}>
     <PolarArea width={474} height={300} data={data} />
    </div>
  );
};

export default PolarChart;
