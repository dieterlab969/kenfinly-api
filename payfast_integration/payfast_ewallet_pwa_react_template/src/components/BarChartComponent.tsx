// BarChartComponent.jsx
import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChartComponent: React.FC = () => {
    const data = {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        datasets: [
            {
                label: "Dataset 1",
                data: [5000, 2000, 4000, 1000, 4500],
                backgroundColor: "green"
            },
            {
                label: "Dataset 2",
                data: [3000, 3500, 3800, 600, 2500],
                backgroundColor: "red"
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom"
            },
            tooltip: {
                callbacks: {
                    label: (context) => `$${context.parsed.y.toLocaleString()}`
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    callback: (value) => `$${value / 1000}k`
                },
                grid: {
                    color: "#eee"
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <div className="bar-chart-container">
            <Bar data={data} options={options} />
        </div>
    );
};

export default BarChartComponent;
