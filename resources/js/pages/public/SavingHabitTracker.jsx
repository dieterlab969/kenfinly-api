import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Trash2, Edit2, Target, TrendingUp, Award, Calendar, DollarSign, Flame, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';

const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

function HabitForm({ habit, onSave, onCancel, loading }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: habit?.name || '',
        amount: habit?.amount || '',
        frequency: habit?.frequency || 7,
        color: habit?.color || '#3B82F6',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
                {habit ? t('habit.edit_habit') : t('habit.create_habit')}
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('habit.name')}
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={t('habit.name_placeholder')}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('habit.amount_per_completion')}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('habit.weekly_goal')}
                        </label>
                        <select
                            value={form.frequency}
                            onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? t('habit.day') : t('habit.days')}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('habit.color')}
                    </label>
                    <div className="flex gap-2">
                        {colorOptions.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setForm({ ...form, color })}
                                className={`w-8 h-8 rounded-full border-2 ${form.color === color ? 'border-gray-800' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {habit ? t('common.save') : t('habit.create')}
                </button>
            </div>
        </form>
    );
}

function HabitCard({ habit, onToggleDay, onEdit, onDelete, selectedDate }) {
    const { t } = useTranslation();
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.trackings?.some(
        tr => tr.date === today && tr.completed
    );

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                    />
                    <div>
                        <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                        <p className="text-sm text-gray-500">
                            ${parseFloat(habit.amount).toFixed(2)} {t('habit.per_completion')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(habit)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(habit.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                    {last7Days.map(date => {
                        const isCompleted = habit.trackings?.some(
                            tr => tr.date === date && tr.completed
                        );
                        return (
                            <button
                                key={date}
                                onClick={() => onToggleDay(habit.id, date)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                                    isCompleted
                                        ? 'text-white'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                                style={isCompleted ? { backgroundColor: habit.color } : {}}
                                title={date}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : new Date(date).getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        {habit.current_streak} {t('habit.day_streak')}
                    </span>
                    <span className="flex items-center gap-1 text-green-500">
                        <DollarSign className="w-4 h-4" />
                        ${parseFloat(habit.total_saved).toFixed(2)} {t('habit.saved')}
                    </span>
                </div>
                <button
                    onClick={() => onToggleDay(habit.id, today)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCompletedToday
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                >
                    {isCompletedToday ? t('habit.completed') : t('habit.mark_done')}
                </button>
            </div>
        </div>
    );
}

function StatsCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function AchievementBadge({ achievement }) {
    const iconMap = {
        'star': '⭐',
        'fire': '🔥',
        'crown': '👑',
        'piggy-bank': '🐷',
        'trophy': '🏆',
        'medal': '🏅',
    };

    return (
        <div className={`p-3 rounded-lg border ${achievement.achieved_at ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
            <div className="flex items-center gap-2">
                <span className="text-2xl">{iconMap[achievement.icon] || '🏆'}</span>
                <div>
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
            </div>
        </div>
    );
}

export default function SavingHabitTracker() {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [habits, setHabits] = useState([]);
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingHabit, setEditingHabit] = useState(null);

    const fetchData = useCallback(async () => {
        // If still loading auth state, don't do anything yet
        if (loading && user === null) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const [habitsRes, statsRes, achievementsRes] = await Promise.all([
                api.get('/saving-tracker/habits'),
                api.get('/saving-tracker/stats/overall'),
                api.get('/saving-tracker/achievements'),
            ]);

            setHabits(habitsRes.data.data || []);
            setStats(statsRes.data.data);
            setAchievements(achievementsRes.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loading, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveHabit = async (form) => {
        setSaving(true);
        try {
            if (editingHabit) {
                await api.put(`/saving-tracker/habits/${editingHabit.id}`, form);
            } else {
                await api.post('/saving-tracker/habits', form);
            }
            setShowForm(false);
            setEditingHabit(null);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save habit');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleDay = async (habitId, date) => {
        try {
            await api.post('/saving-tracker/tracking/toggle', {
                habit_id: habitId,
                date: date,
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update tracking');
        }
    };

    const handleDeleteHabit = async (habitId) => {
        if (!confirm(t('habit.confirm_delete'))) return;

        try {
            await api.delete(`/saving-tracker/habits/${habitId}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete habit');
        }
    };

    const handleEditHabit = (habit) => {
        setEditingHabit(habit);
        setShowForm(true);
    };

    // Global loading state (auth initialization)
    if (loading && user === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="text-center">
                        <Target className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {t('habit.title')}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            {t('habit.description')}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                {t('auth.login')}
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                            >
                                {t('auth.register')}
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Feature loading state (data fetching)
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('habit.title')}</h1>
                        <p className="text-gray-600">{t('habit.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingHabit(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        {t('habit.add_habit')}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="text-sm text-red-500 underline mt-1">
                            {t('common.dismiss')}
                        </button>
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <StatsCard
                            icon={DollarSign}
                            label={t('habit.total_saved')}
                            value={`$${parseFloat(stats.total_saved || 0).toFixed(2)}`}
                            color="bg-green-500"
                        />
                        <StatsCard
                            icon={Target}
                            label={t('habit.active_habits')}
                            value={stats.total_habits || 0}
                            color="bg-blue-500"
                        />
                        <StatsCard
                            icon={Flame}
                            label={t('habit.longest_streak')}
                            value={`${stats.longest_streak || 0} ${t('habit.days')}`}
                            color="bg-orange-500"
                        />
                        <StatsCard
                            icon={TrendingUp}
                            label={t('habit.this_week')}
                            value={stats.this_week_completed || 0}
                            color="bg-purple-500"
                        />
                    </div>
                )}

                {showForm && (
                    <HabitForm
                        habit={editingHabit}
                        onSave={handleSaveHabit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingHabit(null);
                        }}
                        loading={saving}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('habit.your_habits')}</h2>
                        {habits.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t('habit.no_habits')}</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="mt-4 text-blue-600 hover:underline"
                                >
                                    {t('habit.create_first')}
                                </button>
                            </div>
                        ) : (
                            habits.map(habit => (
                                <HabitCard
                                    key={habit.id}
                                    habit={habit}
                                    onToggleDay={handleToggleDay}
                                    onEdit={handleEditHabit}
                                    onDelete={handleDeleteHabit}
                                />
                            ))
                        )}
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            {t('habit.achievements')}
                        </h2>
                        <div className="space-y-3">
                            {achievements.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                    <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">{t('habit.no_achievements')}</p>
                                </div>
                            ) : (
                                achievements.map(achievement => (
                                    <AchievementBadge key={achievement.id} achievement={achievement} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
