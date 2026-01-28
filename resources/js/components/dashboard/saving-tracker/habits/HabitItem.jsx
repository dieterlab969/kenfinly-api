import React from "react";
import {Edit, Trash2} from "lucide-react";
import {getHabitStats} from "../../../../services/saving-tracker/habits";

const HabitItem = ({ habit, onEdit, onDelete }) => {
    const [stats, setStats] = React.useState({
        streak: 0,
        totalSaved: 0
    });

    React.useEffect(() => {
        loadStats();
    }, [habit.id]);

    const loadStats = async() => {
        try {
            const habitStats = await getHabitStats(habit.id);
            setStats(habitStats);
        } catch (error) {
            console.error("Error loading habit stats:", error);
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
           style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div
            className="p-3 rounded-lg border hover:shadow-md transition-all"
            style={{borderLeftColor:habit.color,borderLeftWidth: '4px'}}
            >
            <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium">{habit.name}</h3>
                <div className="flex space-x-1">
                    <button
                        onClick={onEdit}
                        className="text-gray-500 hover:text-blue-500"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-gray-500 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-600">Target: {habit.frequency} days/week</p>
            <p className="text-sm text-gray-600">
                Save: {formatCurrency(habit.amount)} per instance
            </p>
            <div className="mt-2 flex justify-between">
                <span>
                    {stats.streak} day streak 🔥
                </span>
                <span className="text-sm font-medium text-green-600">
                    {formatCurrency(stats.totalSaved)} saved
                </span>
            </div>
        </div>
    );
};

export default HabitItem;
