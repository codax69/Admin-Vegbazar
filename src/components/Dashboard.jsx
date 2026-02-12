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
  Activity,
  BarChart3,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import logo from "../../public/fav.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    },
    {
      id: "OrderReportDash",
      name: "Report Dashboard",
      icon: FileBarChart,
      path: "/order-report-dash",
    },
  ];

  const fetchData = async () => {
    startLoading();
    try {
      const [vegRes, offerRes, orderRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`),
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/baskets`),
        axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/orders/all`),
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

  const activeOrders = orders.filter(
    (order) =>
      order.orderStatus !== "cancelled" && order.orderStatus !== "canceled"
  );

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

  const totalRevenue = activeOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

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
      ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(
        1
      )
      : 0;

  const recentActivities = [
    ...activeOrders.slice(0, 3).map((order) => ({
      type: "order",
      id: order.orderId,
      message: `New order #${order.orderId} - ${order.customerName || order.customerInfo?.name || "Customer"
        }`,
      time: new Date(order.orderDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      color: "bg-[#0e540b]",
      link: "/orders",
    })),
    ...vegetables
      .filter((v) => v.stockKg <= 5)
      .slice(0, 2)
      .map((veg) => ({
        type: "stock",
        message: `${veg.name} stock running low (${veg.stockKg} kg)`,
        time: "Now",
        color: "bg-[#d43900]",
        link: "/vegetables",
      })),
  ].slice(0, 5);

  const statisticsData = [
    {
      title: "TODAY'S ORDERS",
      value: todayOrders,
      icon: ShoppingCart,
      color: "text-white",
      bgColor: "bg-[#0e540b]",
      borderColor: "border-[#0e540b]",
      trend: ordersTrend,
      trendUp: ordersTrend >= 0,
    },
    {
      title: "TODAY'S REVENUE",
      value: `₹${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-black",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      trend: revenueTrend,
      trendUp: revenueTrend >= 0,
    },
    {
      title: "TOTAL STOCK",
      value: totalStockItems,
      icon: Package,
      color: "text-white",
      bgColor: "bg-black",
      borderColor: "border-black",
    },
    {
      title: "ACTIVE OFFERS",
      value: activeOffers,
      icon: Tag,
      color: "text-black",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
    },
    {
      title: "LOW STOCK ALERT",
      value: lowStockItems,
      icon: AlertCircle,
      color: "text-white",
      bgColor: "bg-[#d43900]",
      borderColor: "border-[#d43900]",
    },
    {
      title: "LIFETIME ORDERS",
      value: totalOrders,
      icon: Activity,
      color: "text-black",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 p-5 bg-black rounded-2xl text-white flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-1">Hello, Admin!</h2>
          <p className="text-xs text-gray-400 font-medium mb-3">You have {todayOrders} new orders today.</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#0e540b] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0e540b] animate-pulse"></span>
            System Online
          </p>
        </div>

        <button
          onClick={() => navigate("/add-vegetable")}
          className="group md:col-span-1 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#0e540b] transition-all duration-300 flex flex-col justify-between hover:shadow-md"
        >
          <div className="flex justify-between items-start w-full">
            <div className="p-2 bg-[#0e540b]/10 rounded-xl group-hover:bg-[#0e540b] transition-colors">
              <Plus className="w-5 h-5 text-[#0e540b] group-hover:text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0e540b] transform group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-left mt-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Action</span>
            <span className="text-base font-bold text-black">Add Product</span>
          </div>
        </button>

        <button
          onClick={() => navigate("/offers")}
          className="group md:col-span-1 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#d43900] transition-all duration-300 flex flex-col justify-between hover:shadow-md"
        >
          <div className="flex justify-between items-start w-full">
            <div className="p-2 bg-[#d43900]/10 rounded-xl group-hover:bg-[#d43900] transition-colors">
              <Tag className="w-5 h-5 text-[#d43900] group-hover:text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#d43900] transform group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-left mt-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Action</span>
            <span className="text-base font-bold text-black">New Offer</span>
          </div>
        </button>

        <button
          onClick={() => navigate("/orders")}
          className="group md:col-span-1 p-4 bg-white rounded-2xl border border-gray-200 hover:border-blue-600 transition-all duration-300 flex flex-col justify-between hover:shadow-md"
        >
          <div className="flex justify-between items-start w-full">
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
              <ShoppingCart className="w-5 h-5 text-blue-600 group-hover:text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-left mt-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Action</span>
            <span className="text-base font-bold text-black">Manage Orders</span>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-black uppercase tracking-tight">Real-Time Overview</h3>
          <div className="px-2 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3 h-3" />
            Last updated: Just now
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statisticsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-sm border ${stat.borderColor} p-5 hover:shadow-md transition-all duration-300 group relative overflow-hidden`}
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline mt-2">
                      <h3 className="text-2xl font-bold text-black tracking-tight">
                        {stat.value}
                      </h3>
                      {stat.trend !== undefined && (
                        <div
                          className={`ml-2 flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.trendUp
                              ? "bg-green-50 text-[#0e540b]"
                              : "bg-red-50 text-[#d43900]"
                            }`}
                        >
                          {stat.trendUp ? (
                            <TrendingUp className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5 mr-1" />
                          )}
                          {Math.abs(stat.trend)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics & Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Mini-Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-black uppercase tracking-wide">
              Financial Breakdown
            </h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</span>
              <span className="text-lg font-bold text-black">
                ₹{totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</span>
              <span className="text-lg font-bold text-black">
                {totalOrders}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Value</span>
              <span className="text-lg font-bold text-black">
                ₹{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}
              </span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Revenue Growth (vs Yesterday)</span>
              <span className={`text-xs font-bold ${Number(revenueTrend) >= 0 ? "text-[#0e540b]" : "text-[#d43900]"}`}>
                {Number(revenueTrend) >= 0 ? "+" : ""}{revenueTrend}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${Number(revenueTrend) >= 0 ? "bg-[#0e540b]" : "bg-[#d43900]"}`}
                style={{ width: `${Math.min(Math.abs(Number(revenueTrend)), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wide">
              Recent Activity
            </h3>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[300px] scrollbar-hide">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  onClick={() => activity.link && navigate(activity.link)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer hover:bg-gray-50 ${index !== recentActivities.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${activity.color} flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black leading-snug">
                      {activity.message}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 opacity-50 h-full">
                <Activity className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  No recent activity
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="w-full mt-3 py-2 text-[10px] font-bold uppercase tracking-widest text-center text-gray-500 hover:text-black border-t border-gray-100 transition-colors"
          >
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans">
      {/* Mobile Left sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/30"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-black shadow-lg focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-6 mb-8">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-md">
                  <img
                    src={logo}
                    className="w-5 h-5 object-contain"
                    alt="vegbazar-admin"
                  />
                </div>
                <h1 className="ml-3 text-lg font-bold text-black tracking-tight">
                  VegBazar
                </h1>
              </div>
              <nav className="px-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`${isActive
                          ? "bg-black text-white shadow-md shadow-black/10"
                          : "text-gray-500 hover:bg-gray-100 hover:text-black"
                        } group flex items-center px-4 py-3 text-xs font-bold rounded-xl w-full text-left transition-all duration-200 uppercase tracking-wide`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-4 w-4 ${isActive
                            ? "text-[#0e540b]"
                            : "text-gray-400 group-hover:text-black transition-colors"
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
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-100">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center px-6 mb-8">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <img
                    src={logo}
                    className="w-5 h-5 object-contain"
                    alt="vegbazar-admin"
                  />
                </div>
                <h1 className="ml-3 text-lg font-black text-black tracking-tight">
                  VegBazar<span className="text-[#0e540b]">.</span>
                </h1>
              </div>
              <nav className="flex-1 px-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`${isActive
                          ? "bg-black text-white shadow-lg shadow-black/10 transform translate-x-1"
                          : "text-gray-500 hover:bg-gray-50 hover:text-black hover:font-bold"
                        } group flex items-center px-4 py-3 text-xs font-bold rounded-xl w-full text-left transition-all duration-200 uppercase tracking-wider`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-4 w-4 ${isActive
                            ? "text-[#0e540b]"
                            : "text-gray-300 group-hover:text-black transition-colors"
                          }`}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 m-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0e540b] flex items-center justify-center text-white font-bold text-[10px]">
                  VB
                </div>
                <div>
                  <p className="text-[10px] font-bold text-black">Admin Panel</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">v2.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-50/50">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 items-center justify-between px-6">
          <button
            type="button"
            className="text-gray-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 justify-between items-center ml-4 lg:ml-0">
            <h1 className="text-lg font-black text-black tracking-tight uppercase">
              {navigationItems.find((item) => item.id === activeRoute)
                ?.name || "Dashboard"}
            </h1>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-black">Administrator</span>
                <span className="text-[10px] font-bold text-[#0e540b] uppercase tracking-widest">Super User</span>
              </div>
              <div className="relative group cursor-pointer">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-black/10 group-hover:scale-105 transition-transform">
                  A
                </div>
                <div className="absolute right-0 top-0 w-2.5 h-2.5 bg-[#0e540b] rounded-full ring-2 ring-white"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            {location.pathname === "/" ||
              location.pathname === "/dashboard" ? (
              <DashboardOverview />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;