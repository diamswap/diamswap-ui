import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const FilledGraph = () => {
  // Data for the graph
  const data = {
    labels: [
      "7th July, 2024",
      "12th July, 2024",
      "18th July, 2024",
      "27th July, 2024",
      "1st August, 2024",
      "15th August, 2024",
    ],
    datasets: [
      {
        label: "Total Value Locked",
        data: [20, 40, 60, 80, 90, 100],
        fill: true, // This enables the fill effect
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        tension: 0.4, // For smooth curves
      },
      {
        label: "Trading Volume",
        data: [30, 50, 70, 60, 85, 95],
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
      },
    ],
  };

  // Graph options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#fff",
        },
      },
      title: {
        display: true,
        text: "Trading Metrics",
        color: "#fff",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "#fff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  return (
    <div style={{ backgroundColor: "#121212", padding: "20px", borderRadius: "10px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default FilledGraph;
