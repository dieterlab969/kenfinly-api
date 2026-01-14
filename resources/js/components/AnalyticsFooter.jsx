import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useTranslation } from '@assets/js/contexts/TranslationContext.jsx';

const AnalyticsFooter = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchAnalytics();

        // Refresh stats every 5 minutes
        const interval = setInterval(fetchAnalytics, 300000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('/api/analytics/public-stats');
            if (response.data.success) {
                setStats(response.data.data);
                setError(null);
            } else {
                setError(t('analyticsFooter.loadFailed'));
            }
        } catch (err) {
            setError(t('analyticsFooter.unableToLoad'));
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 border-t border-gray-200 py-6">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    {t('analyticsFooter.loading')}
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return null;
    }

    const {weekly, monthly} = stats;

    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-8">
            <div className="container mx-auto px-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-6 text-center">
                    {t('analyticsFooter.title')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
                    {/* Weekly Stats */}
                    <div className="md:col-span-4 bg-white rounded-lg shadow-sm p-6">
                        <h4 className="text-md font-semibold mb-4 text-blue-700">{t('analyticsFooter.weeklyStats')}</h4>
                        <StatCard
                            title={t('analyticsFooter.visitors')}
                            value={weekly.formatted_users}
                            icon="👥"
                            color="blue"
                        />
                        <StatCard
                            title={t('analyticsFooter.totalSessions')}
                            value={weekly.formatted_sessions}
                            icon="🔄"
                            color="green"
                        />
                        {/* Add other weekly metrics if available */}
                    </div>

                    {/* Monthly Stats */}
                    <div className="md:col-span-4 bg-white rounded-lg shadow-sm p-6">
                        <h4 className="text-md font-semibold mb-4 text-purple-700">{t('analyticsFooter.monthlyStats')}</h4>
                        <StatCard
                            title={t('analyticsFooter.visitors')}
                            value={monthly.formatted_users}
                            icon="👥"
                            color="purple"
                        />
                        <StatCard
                            title={t('analyticsFooter.totalSessions')}
                            value={monthly.formatted_sessions}
                            icon="🔄"
                            color="orange"
                        />
                        {/* Add other monthly metrics if available */}
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>
                        {t('analyticsFooter.lastUpdated', { date: new Date(weekly.updated_at).toLocaleString() })}
                    </p>
                    <p className="mt-1">
                        {t('analyticsFooter.disclaimer')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

const StatCard = ({title, value, icon, color}) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50',
    };

    return (
        <div
            className="mb-4 p-4 rounded border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
                <span className="text-2xl">{icon}</span>
                <div className={`text-lg font-semibold ${colorClasses[color]}`}>{title}</div>
            </div>
            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</div>
        </div>
    );
};

export default AnalyticsFooter;
