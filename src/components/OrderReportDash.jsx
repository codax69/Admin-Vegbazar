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
  FiCalendar
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
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
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

  // Helper function to handle fetch with better error handling
  const fetchWithErrorHandling = async (url) => {
    const response = await fetch(url);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check content type
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
      
      console.log('🚀 Fetching data from API_BASE:', API_BASE);
      
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

      console.log('📊 API Responses:');
      console.log('Overview:', overview);
      console.log('Revenue:', revenue);
      console.log('Customers:', customers);
      console.log('Vegetables:', vegetables);
      console.log('Status:', status);
      console.log('Payment:', payment);
      console.log('Trends:', trends);
      console.log('Repeat:', repeat);

      const processedData = {
        overview: overview.data || {},
        revenue: revenue.data?.revenueByPeriod || [],
        topCustomers: customers.data || [],
        topVegetables: vegetables.data || [],
        orderStatus: status.data || {},
        paymentMethods: payment.data || [],
        monthlyTrends: trends.data || [],
        repeatCustomers: repeat.data?.statistics || {}
      };

      console.log('✅ Processed Dashboard Data:', processedData);
      
      setDashboardData(processedData);
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-2" style={{ color }}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <FiX className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAllReports}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
          >
            <FiRefreshCw size={18} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const { overview, topCustomers, topVegetables, orderStatus, paymentMethods, monthlyTrends, repeatCustomers } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Monitor your vegetable business performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue || 0)}
            icon={FiDollarSign}
            color="#10b981"
            subtitle="All-time earnings"
          />
          <StatsCard
            title="Total Orders"
            value={overview.totalOrders || 0}
            icon={FiShoppingCart}
            color="#3b82f6"
            subtitle={`Avg: ${formatCurrency(overview.averageOrderValue || 0)}`}
          />
          <StatsCard
            title="Delivered Orders"
            value={overview.deliveredOrders || 0}
            icon={FiCheck}
            color="#10b981"
            subtitle={`${orderStatus.highlights?.deliveryRate || '0%'} delivery rate`}
          />
          <StatsCard
            title="Pending Orders"
            value={overview.pendingOrders || 0}
            icon={FiClock}
            color="#f59e0b"
            subtitle={`${overview.cancelledOrders || 0} cancelled`}
          />
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-500" />
            Monthly Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="_id.month" 
                tickFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                  return [value, name === 'totalOrders' ? 'Orders' : 'Delivered'];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="totalRevenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="totalOrders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="deliveredOrders" stroke="#f59e0b" strokeWidth={2} name="Delivered" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiPackage className="mr-2 text-purple-500" />
              Order Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatus.statusBreakdown || []}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry._id}: ${entry.count}`}
                >
                  {(orderStatus.statusBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiDollarSign className="mr-2 text-green-500" />
              Payment Methods
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                  return [value, 'Orders'];
                }} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Orders" />
                <Bar dataKey="totalRevenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers & Top Vegetables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Customers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiUsers className="mr-2 text-blue-500" />
              Top Customers
            </h2>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{customer.customerName}</p>
                      <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(customer.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {formatCurrency(customer.averageOrderValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Repeat Customer Rate</p>
              <p className="text-2xl font-bold text-blue-600">{repeatCustomers.repeatRate || '0%'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {repeatCustomers.repeatCustomers || 0} repeat customers out of {repeatCustomers.totalCustomers || 0}
              </p>
            </div>
          </div>

          {/* Top Vegetables */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiPackage className="mr-2 text-green-500" />
              Best Selling Vegetables
            </h2>
            <div className="space-y-4">
              {topVegetables.map((veg, index) => (
                <div key={veg._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{veg.vegetableName}</p>
                      <p className="text-sm text-gray-500">{veg.totalQuantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(veg.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {veg.orderCount} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={fetchAllReports}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto space-x-2 transition-colors"
          >
            <FiRefreshCw size={18} />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReportDash;