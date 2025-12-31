import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function PaymentDashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/payment-dashboard/overview?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-red-600">Failed to load dashboard</div>;

  const transactionMetrics = data.transactions;
  const gateways = data.gateways;
  const subscriptions = data.subscriptions;
  const alerts = data.alerts || [];

  const chartData = [
    { name: 'Success', value: transactionMetrics.successful_count, fill: '#10b981' },
    { name: 'Failed', value: transactionMetrics.failed_count, fill: '#ef4444' },
    { name: 'Refunded', value: transactionMetrics.refunded_count, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded-lg border flex gap-3 ${
              alert.severity === 'high' ? 'bg-red-50 border-red-200' :
              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              {alert.severity === 'high' ? <AlertTriangle className="text-red-600 flex-shrink-0" /> :
               alert.severity === 'medium' ? <AlertCircle className="text-yellow-600 flex-shrink-0" /> :
               <Activity className="text-blue-600 flex-shrink-0" />}
              <div>
                <h4 className="font-semibold">{alert.title}</h4>
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Transactions" value={transactionMetrics.total} icon={DollarSign} />
        <MetricCard title="Success Rate" value={`${transactionMetrics.success_rate}%`} icon={TrendingUp} />
        <MetricCard title="Active Gateways" value={gateways.filter(g => g.is_active).length} icon={Activity} />
        <MetricCard title="Active Subscriptions" value={subscriptions.active_total} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Transaction Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transaction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gateway Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Gateway Uptime</h3>
          <div className="space-y-3">
            {gateways.map(gateway => (
              <div key={gateway.id} className="flex justify-between items-center">
                <span className="font-medium text-sm">{gateway.name}</span>
                <div className="flex gap-2 items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${gateway.uptime}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12">{gateway.uptime}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-4">User</th>
                <th className="text-left py-2 px-4">Plan</th>
                <th className="text-left py-2 px-4">Amount</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Gateway</th>
                <th className="text-left py-2 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_transactions.map((tx, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{tx.user_name}</td>
                  <td className="py-3 px-4">{tx.plan_name}</td>
                  <td className="py-3 px-4">{tx.currency} {tx.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'active' ? 'bg-green-100 text-green-800' :
                      tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{tx.gateway}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <Icon className="text-blue-500" size={32} />
    </div>
  );
}
