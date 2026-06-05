import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart() {
  const data: ChartData<"doughnut"> = {
    labels: [
      "Payment",
      "Send Money",
      "Transfers Bank",
      "Preapproved Payment",
      "Bills",
    ],
    datasets: [
      {
        data: [38, 17, 8, 18, 19], // values
        backgroundColor: [
          "#00A878", // Payment
          "#FF5C5C", // Send Money
          "#000000", // Transfers Bank
          "#8053F7", // Preapproved Payment
          "#F5A623", // Bills
        ],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    cutout: "70%", // donut thickness
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: "300px", margin: "auto" }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
