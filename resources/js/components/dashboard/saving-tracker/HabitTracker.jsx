import React, { useState, useEffect } from "react";
import { Calendar, Plus, Award, TrendingUp } from "lucide-react";
import HabitList from "./habits/HabitList";
import HabitForm from "./habits/HabitForm";
import TrackingCalendar from  "./tracking/TrackingCalendar";
import SavingsStats from "./stats/SavingsStats";
import AchievementList from "./achievements/AchievementList";
import { getHabits } from "../../../services/saving-tracker/habits";
import { getAchievements } from "../../../services/saving-tracker/achievements";
import { getOverallStats } from "../../../services/saving-tracker/stats";
import { useTranslation } from "../../../contexts/TranslationContext";
import gtmTracking from "../../../utils/gtmTracking";

const HabitTracker = () => {
    const { t } = useTranslation();
    const [habits, setHabits] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
        gtmTracking.trackSavingHabitTrackerView();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [habitsData, achievementsData, statsData] = await Promise.all([
                getHabits(),
                getAchievements(),
                getOverallStats()
            ]);

            setHabits(habitsData);
            setAchievements(achievementsData);
            setStats(statsData);
        } catch(error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditHabit = (habit) => {
        setSelectedHabit(habit);
        setIsFormOpen(true);
    }

    const handleFormClose = () => {
        setSelectedHabit(null);
        setIsFormOpen(false);
    }

    const handleFormSubmit = async () => {
        await loadData();
        handleFormClose();
    };

    if (isLoading) {
        return <div className="p-4 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <header className="bg-green-600 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('saving_tracker.title')}</h1>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-white text-green-600 p-2 rounded-full shadow hover:shadow-lg transition-all"
                        >
                        <Plus size={24} />
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto p-4 flex-grow">
                {habits.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">
                            {t('saving_tracker.start_journey')}
                        </h2>
                        <p className="mb-6 text-gray-600">
                            {t('saving_tracker.create_first_habit_desc')}
                        </p>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center mx-auto"
                            >
                            <Plus size={20} className="mr-2" /> {t('saving_tracker.create_first_habit_btn')}
                        </button>
                    </div>
                ) : (
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                       {/* Habits list */}
                       <div className="lg:col-span-3">
                            <HabitList
                                habits={habits}
                                onEdit={handleEditHabit}
                                onDataChange={loadData}
                            />
                       </div>

                       {/* Calendar and tracking */}
                       <div className="lg:col-span-6">
                           <TrackingCalendar
                               habits={habits}
                               onDataChange={loadData}
                           />
                       </div>

                       {/* Stats and achievements */}
                       <div className="lg:col-span-3">
                            <SavingsStats
                                stats={stats}
                                habits={habits}
                            />
                       </div>

                       <AchievementList
                        achievements={achievements}
                       />
                   </div>
                )}
            </main>

            {/* Main app promotion banner */}
            <div className="bg-blue-600 text-white p-3 text-center">
                <p>
                    {t('saving_tracker.saved_so_far', { amount: formatCurrency(stats.totalSaved || 0) })}
                    <a href="#" className="font-bold underline ml-2">{t('saving_tracker.track_expenses_promo')}</a>
                </p>
            </div>

            {/* Habit form modal */}
            {isFormOpen && (
                <HabitForm
                    habit={selectedHabit}
                    onClose={handleFormClose}
                    onSubmit={handleFormSubmit}
                    />
            )}
        </div>
    );
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

export default HabitTracker;


