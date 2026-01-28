import React from "react";
import { TrendingUp } from "lucide-react";
import { getHabitStats } from "../../../../services/saving-tracker/habits";

const SavingsStats = ({ stats, habits }) => {
    const [habitStats, setHabitStats] = React.useState({});

    React.useEffect(() => {
        if (habits.length > 0) {
            loadHabitStats();
        }
    }, [habits]);

    const loadHabitStats = async () => {
        const statsData = {};

        for (const habit of habits) {
            try {
                const habitStat = await getHabitStats(habit.id);
                statsData[habit.id] = habitStat;
            } catch (error) {
                console.error(`Error loading stats for habit ${habit.id}:`, error);
            }
        }

        setHabitStats(statsData);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2 text-green-600" />
                Savings Summary
            </h2>
            <div className="text-center p-4 bg-green-50 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Total Saved</p>
                <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats.totalSaved)}
                </p>
            </div>
            <div className="space-y-2">
                {habits.map(habit => (
                    <div key={habit.id} className="flex justify-between text-sm p-2 border-b">
                        <span>{habit.name}:</span>
                        <span className="font-medium">
              {formatCurrency(habitStats[habit.id]?.totalSaved || 0)}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavingsStats;
