// AreaChartComponent.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const AreaChartComponent: React.FC = () => {
    const data = {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        datasets: [
            {
                label: "Dataset 1",
                data: [3000, 2000, 4000, 3000, 5000],
                borderColor: "green",
                backgroundColor: "rgba(0,128,0,0.15)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "green",
                pointBorderColor: "green",
                borderWidth: 2
            },
            {
                label: "Dataset 2",
                data: [2500, 3000, 3500, 2000, 4500],
                borderColor: "red",
                backgroundColor: "rgba(255,0,0,0.15)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "red",
                pointBorderColor: "red",
                borderWidth: 2
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const, // ✅ fix typing issue
                labels: {
                    usePointStyle: true,
                    boxWidth: 20,
                    boxHeight: 10,
                },
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `$${context.parsed.y.toLocaleString()}`
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    callback: (value: number | string) => `$${Number(value) / 1000}k`
                },
                grid: {
                    color: "#ddd"
                }
            },
            x: {
                grid: {
                    color: "#eee"
                }
            }
        }
    };


    return (
        <div className="chart-container">
            <Line data={data} options={options} />
        </div>
    );
};

export default AreaChartComponent;
