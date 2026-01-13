// resources/js/components/AnalyticsFooter.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnalyticsFooter = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('weekly'); // 'weekly' or 'monthly'

    useEffect(() => {
        fetchAnalytics();

        // Refresh stats every 5 minutes
        const interval = setInterval(fetchAnalytics, 300000);
        return () => clearInterval(interval);
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const endpoint = period === 'weekly'
                ? '/api/public-analytics/weekly-stats'
                : '/api/public-analytics/monthly-stats';

            const response = await axios.get(endpoint);

            if (response.data.success) {
                setStats(response.data.data);
                setError(null);
            }
        } catch (err) {
            setError('Unable to load analytics data');
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePeriod = () => {
        setLoading(true);
        setPeriod(prev => prev === 'weekly' ? 'monthly' : 'weekly');
    };

    if (loading) {
        return (
            <div className="bg-gray-50 border-t border-gray-200 py-6">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    Loading site statistics...
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return null;
    }

    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Site Statistics
                    </h3>

                    <button
                        onClick={togglePeriod}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        View {period === 'weekly' ? 'Monthly' : 'Weekly'} Stats
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title={`${period === 'weekly' ? 'Weekly' : 'Monthly'} Visitors`}
                        value={stats.formatted_users}
                        icon="👥"
                        color="blue"
                    />

                    <StatCard
                        title="Total Sessions"
                        value={stats.formatted_sessions}
                        icon="🔄"
                        color="green"
                    />

                    <StatCard
                        title="Page Views"
                        value={stats.formatted_page_views}
                        icon="📄"
                        color="purple"
                    />

                    <StatCard
                        title="Avg. Pages/Session"
                        value={stats.average_pages_per_session}
                        icon="📊"
                        color="orange"
                    />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Last updated: {new Date(stats.updated_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        These statistics represent aggregate, anonymized data.
                        Your individual browsing activity is protected by our privacy policy.
                    </p>
                </div>
            </div>
        </footer>
    );
};

const StatCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                    <span className="text-lg font-bold">{icon}</span>
                </div>
            </div>

            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]} mb-2`}>
                {value}
            </div>

            <div className="text-sm text-gray-600 uppercase tracking-wide">
                {title}
            </div>
        </div>
    );
};

export default AnalyticsFooter;
