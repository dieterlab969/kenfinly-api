import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getTracking, toggleTracking } from "../../../../services/saving-tracker/tracking";
const TrackingCalendar = ({ habits, onDataChange }) => {
    const [calendarDays, setCalendarDays] = useState([]);
    const [tracking, setTracking] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        generateCalendarDays();
        if (habits.length > 0) {
            loadTrackingData();
        } else {
            setIsLoading(false);
        }
    }, [habits]);

    const generateCalendarDays = () => {
        const days = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push({
                date,
                formattedDate: date.toISOString().split('T')[0]
            });
        }

        setCalendarDays(days);
    };

    const loadTrackingData = async () => {
        setIsLoading(true);
        try {
            const trackingData = {};

            for (const habit of habits) {
                const habitTracking = await getTracking(habit.id);
                trackingData[habit.id] = habitTracking;
            }

            setTracking(trackingData);
        } catch (error) {
            console.error("Error loading tracking data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTracking = async (habitId, date) => {
        try {
            const result = await toggleTracking(habitId, date);

            setTracking(prev => {
                const habitTracking = { ...prev[habitId] };
                habitTracking[date] = result.completed;
                return {
                    ...prev,
                    [habitId]: habitTracking
                };
            });

            // Notify parent component about data change
            onDataChange();
        } catch (error) {
            console.error("Error toggling tracking:", error);
        }
    };

    if (isLoading) {
        return <div className="bg-white rounded-lg shadow-sm p-4">Loading calendar...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-green-600" />
                Tracking Calendar
            </h2>
            <div className="mb-4 grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 py-1">
                        {day}
                    </div>
                ))}
            </div>
            <div className="mb-8">
                {habits.map(habit => (
                    <div key={habit.id} className="mb-6">
                        <div
                            className="mb-2 flex items-center"
                            style={{ color: habit.color }}
                        >
              <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: habit.color }}
              ></span>
                            <span className="text-sm font-medium">{habit.name}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(day => {
                                const isTracked = tracking[habit.id]?.[day.formattedDate] || false;
                                const dayNumber = day.date.getDate();

                                return (
                                    <button
                                        key={day.formattedDate}
                                        className={`
                      p-2 rounded-md text-center text-sm
                      ${isTracked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                      hover:shadow-sm transition-all
                    `}
                                        onClick={() => handleToggleTracking(habit.id, day.formattedDate)}
                                    >
                                        {dayNumber}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrackingCalendar;
