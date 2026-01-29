import React, { useState, useEffect } from 'react';
import {
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiPackage,
  FiDollarSign,
  FiCheck,
  FiClock,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const OrderReportDash = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    revenue: [],
    topCustomers: [],
    topVegetables: [],
    orderStatus: {},
    paymentMethods: [],
    monthlyTrends: [],
    repeatCustomers: {}
  });

  const API_BASE = `${import.meta.env.VITE_API_SERVER_URL}/api/reports`;

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchWithErrorHandling = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    return await response.json();
  };

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overview,
        revenue,
        customers,
        vegetables,
        status,
        payment,
        trends,
        repeat
      ] = await Promise.all([
        fetchWithErrorHandling(`${API_BASE}/dashboard`),
        fetchWithErrorHandling(`${API_BASE}/revenue?groupBy=day`),
        fetchWithErrorHandling(`${API_BASE}/top-customers?limit=5`),
        fetchWithErrorHandling(`${API_BASE}/most-sold-vegetables?limit=5`),
        fetchWithErrorHandling(`${API_BASE}/order-status`),
        fetchWithErrorHandling(`${API_BASE}/payment-methods`),
        fetchWithErrorHandling(`${API_BASE}/monthly-trends?months=6`),
        fetchWithErrorHandling(`${API_BASE}/repeat-customers`)
      ]);

      setDashboardData({
        overview: overview.data || {},
        revenue: revenue.data?.revenueByPeriod || [],
        topCustomers: customers.data || [],
        topVegetables: vegetables.data || [],
        orderStatus: status.data || {},
        paymentMethods: payment.data || [],
        monthlyTrends: trends.data || [],
        repeatCustomers: repeat.data?.statistics || {}
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Modern Chart Colors matching the theme
  const COLORS = ['#0e540b', '#d43900', '#10b981', '#f59e0b', '#6366f1'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatsCard = ({ title, value, icon: Icon, color, subtitle, borderColor }) => (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border-2 ${borderColor || 'border-gray-100'} hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black mt-2 text-black tracking-tighter">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs font-bold text-gray-500 mt-2 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0e540b]/20 border-t-[#0e540b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiX className="text-[#d43900]" size={32} />
          </div>
          <h2 className="text-xl font-black text-black mb-2">Failed to Load</h2>
          <p className="text-gray-500 font-medium mb-8 text-sm">{error}</p>
          <button
            onClick={fetchAllReports}
            className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#d43900] transition-colors flex items-center justify-center gap-2"
          >
            <FiRefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const { overview, topCustomers, topVegetables, orderStatus, paymentMethods, monthlyTrends, repeatCustomers } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight uppercase">Analytics Report</h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-1">Deep dive into your business stats</p>
          </div>
          <button
            onClick={fetchAllReports}
            className="bg-white border-2 border-gray-200 text-black hover:border-[#0e540b] hover:text-[#0e540b] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
          >
            <FiRefreshCw size={14} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue || 0)}
            icon={FiDollarSign}
            color="#0e540b"
            borderColor="border-[#0e540b]"
            subtitle="All-time earnings"
          />
          <StatsCard
            title="Total Orders"
            value={overview.totalOrders || 0}
            icon={FiShoppingCart}
            color="#000000"
            borderColor="border-gray-200"
            subtitle={`Avg: ${formatCurrency(overview.averageOrderValue || 0)}`}
          />
          <StatsCard
            title="Delivered"
            value={overview.deliveredOrders || 0}
            icon={FiCheck}
            color="#0e540b"
            borderColor="border-gray-200"
            subtitle={`${orderStatus.highlights?.deliveryRate || '0%'} success rate`}
          />
          <StatsCard
            title="Pending"
            value={overview.pendingOrders || 0}
            icon={FiClock}
            color="#d43900"
            borderColor="border-[#d43900]"
            subtitle={`${overview.cancelledOrders || 0} cancelled`}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8 lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-black uppercase tracking-wide flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FiTrendingUp size={18} />
                </div>
                Monthly Trends
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="_id.month"
                    tickFormatter={(month) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value, name) => [
                      name === 'totalRevenue' ? formatCurrency(value) : value,
                      name === 'totalRevenue' ? 'Revenue' : (name === 'totalOrders' ? 'Orders' : 'Delivered')
                    ]}
                  />
                  <Legend iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="totalRevenue" stroke="#0e540b" strokeWidth={3} dot={{ r: 4, fill: '#0e540b' }} activeDot={{ r: 6 }} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="totalOrders" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: '#000000' }} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8">
            <h2 className="text-lg font-black text-black uppercase tracking-wide mb-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <FiPackage size={18} />
              </div>
              Order Status
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus.statusBreakdown || []}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                  >
                    {(orderStatus.statusBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8">
            <h2 className="text-lg font-black text-black uppercase tracking-wide mb-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <FiDollarSign size={18} />
              </div>
              Payment Methods
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ fill: '#f9fafb' }}
                    formatter={(value, name) => [name === 'totalRevenue' ? formatCurrency(value) : value, name === 'totalRevenue' ? 'Revenue' : 'Count']}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="count" fill="#000000" radius={[4, 4, 0, 0]} name="Count" />
                  <Bar dataKey="totalRevenue" fill="#0e540b" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Customers */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8 flex flex-col">
            <h2 className="text-lg font-black text-black uppercase tracking-wide mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FiUsers size={18} />
              </div>
              Top Customers
            </h2>
            <div className="flex-1 space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#0e540b] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-[#0e540b] transition-colors">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">{customer.customerName}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{customer.totalOrders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#0e540b] text-sm">
                      {formatCurrency(customer.totalRevenue)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Avg: {formatCurrency(customer.averageOrderValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-[#0e540b]/5 rounded-2xl border border-[#0e540b]/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Customer Loyalty</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-[#0e540b]">{repeatCustomers.repeatRate || '0%'}</p>
                <span className="text-xs font-bold text-[#0e540b]">Repeat Rate</span>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2">
                {repeatCustomers.repeatCustomers || 0} returning customers from {repeatCustomers.totalCustomers || 0} total.
              </p>
            </div>
          </div>

          {/* Top Vegetables */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8">
            <h2 className="text-lg font-black text-black uppercase tracking-wide mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <FiPackage size={18} />
              </div>
              Best Sellers
            </h2>
            <div className="space-y-4">
              {topVegetables.map((veg, index) => (
                <div key={veg._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#0e540b] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-[#0e540b] transition-colors">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">{veg.vegetableName}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{veg.totalQuantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#0e540b] text-sm">
                      {formatCurrency(veg.totalRevenue)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {veg.orderCount} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReportDash;