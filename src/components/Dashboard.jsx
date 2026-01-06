import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import {
  Home,
  Carrot,
  ShoppingCart,
  Tag,
  MapPin,
  Plus,
  MessageSquare,
  Ticket,
  FileBarChart,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  DollarSign,
  Users,
  Clock,
  Activity,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import logo from "../../public/fav.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [vegetables, setVegetables] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);

  const getActiveRoute = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    return path.substring(1);
  };

  const activeRoute = getActiveRoute();

  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, path: "/" },
    { id: "vegetables", name: "Vegetables", icon: Carrot, path: "/vegetables" },
    { id: "orders", name: "Orders", icon: ShoppingCart, path: "/orders" },
    { id: "offers", name: "Offers", icon: Tag, path: "/offers" },
    { id: "AddCity", name: "Add City", icon: MapPin, path: "/add-city" },
    {
      id: "add-vegetable",
      name: "Add Vegetable",
      icon: Plus,
      path: "/add-vegetable",
    },
    {
      id: "testimonials",
      name: "Testimonials",
      icon: MessageSquare,
      path: "/testimonials",
    },
    {
      id: "coupon_codes",
      name: "Coupon Codes",
      icon: Ticket,
      path: "/coupon_codes",
    },
    {
      id: "OrderReport",
      name: "Order Report",
      icon: FileBarChart,
      path: "/orderReport",
    },{
      id: "OrderReportDash",
      name: "Order Report Dashboard",
      icon: FileBarChart,
      path: "/order-report-dash",
    },
  ];

  const fetchData = async () => {
    startLoading();
    try {
      const [vegRes, offerRes, orderRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`),
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/offers`),
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/orders`),
      ]);
      setVegetables(vegRes.data.data || []);
      setOffers(offerRes.data.data || []);
      setOrders(orderRes.data.data.orders || []);
    } catch (error) {
      console.log("Error fetching dashboard stats:", error.message);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Filter out cancelled orders for all calculations
  const activeOrders = orders.filter(
    (order) => order.orderStatus !== "cancelled" && order.orderStatus !== "canceled"
  );

  // Derived statistics with real data (excluding cancelled orders)
  const totalStockItems = vegetables.length;
  const activeOffers = offers.length;
  const lowStockItems = vegetables.filter((v) => v.stockKg <= 2).length;

  const todayOrders = activeOrders.filter((o) => {
    const today = new Date().toISOString().split("T")[0];
    return o.orderDate?.startsWith(today);
  }).length;

  const totalOrders = activeOrders.length;

  const todayRevenue = activeOrders
    .filter((o) => {
      const today = new Date().toISOString().split("T")[0];
      return o.orderDate?.startsWith(today);
    })
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Calculate yesterday's stats for comparison (excluding cancelled orders)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const yesterdayOrders = activeOrders.filter((o) =>
    o.orderDate?.startsWith(yesterdayStr)
  ).length;
  
  const yesterdayRevenue = activeOrders
    .filter((o) => o.orderDate?.startsWith(yesterdayStr))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const ordersTrend =
    yesterdayOrders > 0
      ? (((todayOrders - yesterdayOrders) / yesterdayOrders) * 100).toFixed(1)
      : 0;

  const revenueTrend =
    yesterdayRevenue > 0
      ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
      : 0;

  // Recent activities with real data (excluding cancelled orders)
  const recentActivities = [
    ...activeOrders.slice(0, 2).map((order) => ({
      type: "order",
      message: `New order #${order.orderId} - ${order.customerName || order.customerInfo?.name || "Customer"}`,
      time: new Date(order.orderDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      color: "bg-green-400",
    })),
    ...vegetables
      .filter((v) => v.stockKg <= 2)
      .slice(0, 2)
      .map((veg) => ({
        type: "stock",
        message: `${veg.name} stock running low (${veg.stockKg} kg)`,
        time: "Now",
        color: "bg-red-400",
      })),
  ].slice(0, 4);

  const statisticsData = [
    {
      title: "Total Orders Today",
      value: todayOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: ordersTrend,
      trendUp: ordersTrend >= 0,
    },
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: revenueTrend,
      trendUp: revenueTrend >= 0,
    },
    {
      title: "Total Stock Items",
      value: totalStockItems,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Offers",
      value: activeOffers,
      icon: Tag,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Low Stock Alert",
      value: lowStockItems,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Modern Dashboard Overview Component
  const DashboardOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h2>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your store today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statisticsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline mt-2">
                    <h3 className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </h3>
                    {stat.trend !== undefined && (
                      <div
                        className={`ml-3 flex items-center text-sm font-medium ${
                          stat.trendUp ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.trendUp ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(stat.trend)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-lg font-semibold text-gray-900">
                ₹{totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="text-lg font-semibold text-gray-900">
                {totalOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-lg font-semibold text-gray-900">
                ₹{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${activity.color} flex-shrink-0`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/add-vegetable")}
            className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Add Vegetable
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            onClick={() => navigate("/offers")}
            className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Create Offer
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            onClick={() => navigate("/orders")}
            className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                View Orders
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Left sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-lg focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-6 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <img
                    src={logo}
                    className="w-6 h-6 text-white"
                    alt="vegbazar-admin"
                  />
                </div>
                <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  VegBazar
                </h1>
              </div>
              <nav className="px-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`${
                        activeRoute === item.id
                          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-l-4 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      } group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-150`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          activeRoute === item.id
                            ? "text-green-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex flex-col items-center flex-shrink-0 px-6 mb-8">
                <div className="w-12 rounded-lg flex items-center justify-center">
                  <img
                    src={logo}
                    className="w-12 text-white"
                    alt="vegbazar-admin"
                  />
                </div>
                <h1 className="text-xl font-bold text-black bg-clip-text ">
                  VegBazar
                </h1>
              </div>
              <nav className="flex-1 px-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`${
                        activeRoute === item.id
                          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-l-4 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      } group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-150`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          activeRoute === item.id
                            ? "text-green-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find((item) => item.id === activeRoute)
                  ?.name || "Dashboard"}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {location.pathname === "/" ||
              location.pathname === "/dashboard" ? (
                <DashboardOverview />
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;