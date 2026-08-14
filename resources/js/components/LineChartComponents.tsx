import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";

// Register chart components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function LineChartComponents() {
  // Define dataset type for line chart
  const data: ChartData<"line"> = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [
      {
        label: "Dataset 1",
        data: [3000, 5000, 2000, 4000, 3000],
        borderColor: "green",
        backgroundColor: "rgba(0, 128, 0, 0.2)",
        fill: "+1",
        tension: 0.4,
        pointBackgroundColor: "green",
        pointBorderColor: "#fff",
        pointRadius: 5,
      },
      {
        label: "Dataset 2",
        data: [2500, 3000, 3500, 2000, 4500],
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: "-1",
        tension: 0.4,
        pointBackgroundColor: "red",
        pointBorderColor: "#fff",
        pointRadius: 5,
      },
    ],
  };

  // Options type
  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "line",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y}k`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value}k`,
        },
      },
    },
  };

  return (
    <div className="line-chart-container">
      <Line data={data} options={options} />
    </div>
  );
}
