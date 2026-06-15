import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, Settings, User, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../utils/api';
import AddTransactionModal from '../components/AddTransactionModal';
import DynamicLogo from '../components/DynamicLogo';
import SettingsModal from '../components/SettingsModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import PaymentInfoModal from '../components/PaymentInfoModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import EditTransactionModal from '../components/EditTransactionModal';
import MonthlySummaryCard from '../components/dashboard/MonthlySummaryCard';
import BalanceTrendChart from '../components/dashboard/BalanceTrendChart';
import AttendanceWidget from '../components/dashboard/AttendanceWidget';
import { getCategoryIcon, formatCurrency } from '../constants/categories';
import type { Transaction } from '../components/EditTransactionModal';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthUser {
    name: string;
    email?: string;
}

interface DashboardCategory {
    id: number;
    name: string;
    slug: string;
}

interface DashboardTransactionAccount {
    name: string;
}

interface DashboardTransaction {
    id: number;
    type: 'income' | 'expense';
    amount: number | string;
    transaction_date: string;
    category?: DashboardCategory;
    account?: DashboardTransactionAccount;
}

interface DashboardAccount {
    id: number;
    name: string;
    balance: string | number;
}

interface SevenDayExpense {
    date: string;
    total: string | number;
}

interface ChartDataPoint {
    date: string;
    amount: number;
}

interface DashboardData {
    accounts?: DashboardAccount[];
    recent_transactions?: DashboardTransaction[];
    seven_day_expenses?: SevenDayExpense[];
    monthly_summary?: unknown;
    balance_history?: unknown;
}

type DayTranslationMap = Record<string, string>;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth() as { user: AuthUser | null; logout: () => Promise<void> };
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
    const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState<boolean>(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
    const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (showLoading: boolean = true): Promise<void> => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await api.get('/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const handleLogout = async (): Promise<void> => {
        await logout();
        navigate('/login');
    };

    const handleTransactionAdded = (newTransaction?: DashboardTransaction | Transaction): void => {
        if (newTransaction && dashboardData) {
            setDashboardData(prev => ({
                ...prev,
                recent_transactions: [
                    newTransaction as DashboardTransaction,
                    ...(prev?.recent_transactions || [])
                ].slice(0, 6)
            }));
        }
        
        fetchDashboardData(false).catch(error => {
            console.error('Failed to refresh dashboard data:', error);
        });
    };

    const prepareChartData = (): ChartDataPoint[] => {
        if (!dashboardData?.seven_day_expenses) return [];
        
        const last7Days: ChartDataPoint[] = [];
        const today: Date = new Date();
        const dayTranslations: DayTranslationMap = {
            'Mon': 'Thứ 2',
            'Tue': 'Thứ 3',
            'Wed': 'Thứ 4',
            'Thu': 'Thứ 5',
            'Fri': 'Thứ 6',
            'Sat': 'Thứ 7',
            'Sun': 'CN'
        };
        
        for (let i = 6; i >= 0; i--) {
            const date: Date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr: string = format(date, 'yyyy-MM-dd');
            
            const existingData: SevenDayExpense | undefined = dashboardData.seven_day_expenses!.find(
                (item: SevenDayExpense) => item.date === dateStr
            );
            
            const dayName: string = format(date, 'EEE');
            last7Days.push({
                date: dayTranslations[dayName] || dayName,
                amount: existingData ? parseFloat(String(existingData.total)) : 0
            });
        }
        
        return last7Days;
    };

    const totalBalance: number = dashboardData?.accounts?.reduce(
        (sum: number, account: DashboardAccount) => sum + parseFloat(String(account.balance)), 
        0
    ) || 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('dashboard.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <DynamicLogo className="w-8 h-8" iconClassName="w-5 h-5" textClassName="text-xl font-bold" />
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                {t('nav.welcome')}, <span className="font-medium">{user?.name}</span>
                            </span>
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title={t('nav.payment') || 'Payment'}
                            >
                                <CreditCard className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowAccountModal(true)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title={t('nav.account')}
                            >
                                <User className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title={t('nav.settings')}
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all duration-200"
                            >
                                {t('auth.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <AttendanceWidget onRewardCreated={() => fetchDashboardData(false)} />

                <MonthlySummaryCard monthlySummary={dashboardData?.monthly_summary} />

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.expenses_7days')}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={prepareChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                interval={0}
                            />
                            <YAxis 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                tickFormatter={(value: number) => {
                                    if (value >= 1000000) {
                                        return `${(value / 1000000).toFixed(0)}M`;
                                    }
                                    if (value >= 1000) {
                                        return `${(value / 1000).toFixed(0)}k`;
                                    }
                                    return value.toFixed(0);
                                }}
                            />
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar 
                                dataKey="amount" 
                                name={t('dashboard.chart_amount')}
                                fill="#ef4444"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <BalanceTrendChart 
                    balanceHistory={dashboardData?.balance_history} 
                    totalBalance={totalBalance}
                />

                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{t('dashboard.recent_transactions')}</h3>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {t('dashboard.view_all')}
                        </button>
                    </div>
                    
                    {dashboardData?.recent_transactions?.length ?? 0 > 0 ? (
                        <div className="space-y-3">
                            {dashboardData?.recent_transactions?.map((transaction: DashboardTransaction) => (
                                <div
                                    key={transaction.id}
                                    onClick={() => {
                                        setSelectedTransactionId(transaction.id);
                                        setShowEditModal(true);
                                    }}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                            transaction.type === 'income' 
                                                ? 'bg-green-100' 
                                                : 'bg-blue-100'
                                        }`}>
                                            {getCategoryIcon(transaction.category?.slug)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {t(`categories.${transaction.category?.slug}`) || transaction.category?.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {format(parseISO(transaction.transaction_date), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${
                                            transaction.type === 'income' 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {transaction.account?.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-600 mb-4">{t('dashboard.no_transactions')}</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('dashboard.add_first_transaction')}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
                aria-label={t('transaction.add_button_label')}
            >
                <Plus className="w-6 h-6" />
            </button>

            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleTransactionAdded}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />

            <AccountSettingsModal
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
            />

            <PaymentInfoModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onOpenHistory={() => setShowPaymentHistoryModal(true)}
            />

            <PaymentHistoryModal
                isOpen={showPaymentHistoryModal}
                onClose={() => setShowPaymentHistoryModal(false)}
            />

            <TransactionDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedTransactionId(null);
                }}
                transactionId={selectedTransactionId}
                onUpdate={handleTransactionAdded}
            />

            <EditTransactionModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedTransactionId(null);
                }}
                transactionId={selectedTransactionId}
                onUpdate={handleTransactionAdded}
            />
        </div>
    );
};

export default Dashboard;
