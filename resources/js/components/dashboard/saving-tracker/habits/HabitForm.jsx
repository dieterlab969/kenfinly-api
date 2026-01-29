import React, {useState, useEffect} from "react";
import {createHabit, updateHabit} from "../../../../services/saving-tracker/habits";

const HabitForm = ({habit, onClose, onSubmit}) => {
    const [formData, setFormData] = useState({
        name: "",
        amount: 0,
        frquency: 1,
        color: "#4CAF50"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (habit) {
            setFormData({
                name: habit.name,
                amount: habit.amount,
                frequency: habit.frequency,
                color: habit.color
            });
        }
    }, [habit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' || name === 'frequency' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
           if (habit) {
               await updateHabit(habit.id, formData);
           } else {
               await createHabit(formData);
           }
        } catch (error) {
            console.error("Error saving habit:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">{habit ? "Edit Habit" : "Create New Habit"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                       <label className="block text-gray-700 text-sm font-medium mb-1">
                           Habit Name
                       </label>
                       <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., No buying coffee outside"
                        className="w-full p-2 border rounded-md"
                        required
                       />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Amount Saved Per Instance (VND)
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="e.g., 30000"
                            className="w-full p-2 border rounded-md"
                            min="0"
                            required
                        />
                    </div>

                    <div className="mb-4">
                       <label className="block text-gray-700 text-sm font-medium mb-1">Target Frequency (days/week)</label>
                        <input
                            type="number"
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            min="1"
                            max="7"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1">Color</label>

                        <input
                            type="color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="w-full p-1 h-10 border rounded-md"
                        />

                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HabitForm;
