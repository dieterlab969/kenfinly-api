import React from "react";
import {Calendar, Edit, Trash2} from "lucide-react";
import HabitItem from "./HabitItem";
import { deleteHabit } from "../../../../services/saving-tracker/habits";

const HabitList = ({ habits, onEdit, onDataChange }) => {
    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this habit?")) {
            try {
                await deleteHabit(id);
                onDataChange();
            } catch (error) {
                console.error("Error deleting habit:", error);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-green-600" />
                Your Habits
            </h2>
            <div className="space-y-3">
                {habits.map(habit => (
                    <HabitItem
                        key={habit.id}
                        habit={habit}
                        onEdit={() => onEdit(habit)}
                        onDelete={() => handleDelete(habit.id)}
                    />
                ))}

                {habits.length < 5 && (
                    <button
                        onClick={() => onEdit(null)}
                        className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center"
                    >
                        <Plus size={16} className="mr-2" /> Add New Habit
                    </button>
                )}
            </div>
        </div>
    );
};

export default HabitList;
