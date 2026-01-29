// Part 1/3 - OrderTable.jsx (Imports, State, API Calls, and Helper Functions)

import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  X,
  Package,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ChevronRight,
  Eye,
  Edit,
  Grid3x3,
  List,
  Calendar,
  Phone,
  Mail,
  Tag,
  ShoppingBag
} from "lucide-react";
const OrderTable = () => {
  const { startLoading, stopLoading } = useLoading();

  // State Management
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // API call to fetch orders
  const OrdersApiCall = async () => {
    setLoading(true);
    startLoading();
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders/all`
      );
      const data = response.data?.data?.orders || [];

      const formattedOrders = data.map((o) => ({
        _id: o._id,
        orderId: o.orderId,
        date:
          new Date(o.orderDate).toLocaleDateString() +
          " " +
          new Date(o.orderDate).toLocaleTimeString(),
        customerName: o.customerInfo?.username || "N/A",
        email: o.customerInfo?.email || "N/A",
        phone: o.customerInfo?.phone || "N/A",
        address: o.deliveryAddressId?.street || "N/A",
        state: o.deliveryAddressId?.state || "N/A",
        city: o.deliveryAddressId?.city || "N/A",
        area: o.deliveryAddressId?.area || "N/A",
        package:
          o.orderType === "basket" ? o.selectedOffer?.title : "Custom Order",
        amount: o.totalAmount || 0,
        vegetablesTotal: o.vegetablesTotal || 0,
        offerPrice: o.offerPrice || 0,
        deliveryCharges: o.deliveryCharges || 0,
        discount: o.discount || 0,
        coupon: o.coupon || null,
        status: o.orderStatus || "placed",
        paymentStatus: o.paymentStatus || "pending",
        paymentMethod: o.paymentMethod || "N/A",
        orderType: o.orderType,
        vegetables: (o.selectedVegetables || []).map((v) => ({
          name: v.vegetable?.name || "Unknown",
          weight: v.weight || "N/A",
          quantity: v.quantity || 1,
          pricePerUnit: v.pricePerUnit || 0,
          subtotal: v.subtotal || 0,
          isFromBasket: v.isFromBasket || false,
          vegBazarPrice: v.pricePerUnit || 0,
          marketPrice: getMarketPriceForWeight(v.vegetable, v.weight),
        })),
        items: (o.selectedVegetables || []).map(
          (v) => v.vegetable?.name || "Unknown"
        ),
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.log(error?.message || error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  // Helper to get market price by weight key
  const getMarketPriceForWeight = (vegetable, weight) => {
    if (!vegetable?.marketPrices) return 0;

    const weightKey = (weight || "").replace(/\s/g, "").toLowerCase();
    const marketPrices = vegetable.marketPrices;

    switch (weightKey) {
      case "100g":
        return marketPrices.weight100g || 0;
      case "250g":
        return marketPrices.weight250g || 0;
      case "500g":
        return marketPrices.weight500g || 0;
      case "1kg":
        return marketPrices.weight1kg || 0;
      default:
        return 0;
    }
  };

  // Update order status API
  const updateOrderStatus = async (orderId, newStatus) => {
    startLoading();
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders/${orderId}/status`,
        { orderStatus: newStatus }
      );

      if (response.data?.success) {
        toast.success(`Order status updated to ${newStatus}`);
        await OrdersApiCall();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        setShowStatusModal(false);
        setSelectedOrderForUpdate(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update order status"
      );
    } finally {
      stopLoading();
    }
  };

  // Update payment status API
  const updatePaymentStatus = async (orderId, newStatus) => {
    startLoading();
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders/${orderId}`,
        { paymentStatus: newStatus }
      );

      if (response.data?.success) {
        toast.success(`Payment status updated to ${newStatus}`);
        await OrdersApiCall();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update payment status"
      );
    } finally {
      stopLoading();
    }
  };

  const handleQuickStatusUpdate = (order, newStatus) => {
    updateOrderStatus(order._id, newStatus);
  };

  useEffect(() => {
    OrdersApiCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters + search
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      (order.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.phone || "").includes(searchTerm);

    const matchesStatus =
      filterStatus === "" ||
      (order.status || "").toLowerCase() === filterStatus.toLowerCase();

    const matchesPayment =
      filterPayment === "" ||
      (order.paymentStatus || "").toLowerCase() === filterPayment.toLowerCase();

    const matchesDate =
      filterDate === "" || (order.date || "").includes(filterDate);

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Modern Color Helpers - Black/White with Green/Orange Accents
  const getStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "delivered":
        return {
          bg: "bg-[#0e540b]/10",
          text: "text-[#0e540b]",
          border: "border-[#0e540b]/20",
          icon: CheckCircle
        };
      case "processing":
      case "processed":
        return {
          bg: "bg-[#d43900]/10",
          text: "text-[#d43900]",
          border: "border-[#d43900]/20",
          icon: Clock
        };
      case "shipped":
        return {
          bg: "bg-black/5",
          text: "text-black",
          border: "border-black/10",
          icon: Truck
        };
      case "placed":
      case "pending":
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: Package
        };
      case "cancelled":
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          border: "border-red-200",
          icon: XCircle
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: Package
        };
    }
  };

  const getPaymentConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "completed":
      case "paid":
        return {
          bg: "bg-[#0e540b]/10",
          text: "text-[#0e540b]",
          border: "border-[#0e540b]/20"
        };
      case "pending":
        return {
          bg: "bg-[#d43900]/10",
          text: "text-[#d43900]",
          border: "border-[#d43900]/20"
        };
      case "failed":
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          border: "border-red-200"
        };
      case "refunded":
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200"
        };
    }
  };

  // Part 2/4 - OrderTable.jsx (Order Card Component with Status Update)

  // Modern Order Card Component with Click to Open Details
  const OrderCard = ({ order }) => {
    const statusConfig = getStatusConfig(order.status);
    const paymentConfig = getPaymentConfig(order.paymentStatus);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="bg-white border border-gray-200 hover:border-black/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl group">
        {/* Clickable Card Content */}
        <div
          onClick={() => setSelectedOrder(order)}
          className="p-4 cursor-pointer"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-black text-base truncate">
                  {order.orderId}
                </h3>
                {order.orderType === "basket" && (
                  <span className="px-2 py-0.5 bg-[#0e540b]/10 text-[#0e540b] text-xs font-medium rounded">
                    BASKET
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {order.date}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 ml-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex items-center gap-1 whitespace-nowrap`}>
                <StatusIcon className="w-3 h-3" />
                {order.status}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border} whitespace-nowrap`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Customer & Location */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium">Customer</span>
              </div>
              <p className="text-sm font-medium text-black truncate">{order.customerName}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.phone}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-sm text-black truncate">{order.area}</p>
              <p className="text-xs text-gray-600 truncate">{order.city}, {order.state}</p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Items ({order.items.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {order.items.slice(0, 3).map((item, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {item}
                </span>
              ))}
              {order.items.length > 3 && (
                <span className="px-2 py-1 bg-black/5 text-black/60 rounded text-xs font-medium">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Coupon Badge */}
          {order.coupon && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-[#0e540b]/10 to-[#d43900]/10 border border-[#0e540b]/20 rounded-lg">
                <Tag className="w-3.5 h-3.5 text-[#0e540b]" />
                <span className="text-xs font-bold text-black uppercase">{order.coupon.code}</span>
                <span className="text-xs text-gray-600">
                  {order.coupon.discountType === "percentage"
                    ? `${order.coupon.discountValue}% OFF`
                    : `₹${order.coupon.discountValue} OFF`}
                </span>
              </div>
            </div>
          )}

          {/* Footer - Amount */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-black">₹{order.amount}</p>
              </div>
              <div className="text-xs text-gray-400 group-hover:text-black transition-colors">
                Click to view details →
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Buttons - Below Card Content */}
        <div className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, "placed");
              }}
              disabled={order.status === "placed"}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${order.status === "placed"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
            >
              <Package className="w-3.5 h-3.5" />
              Placed
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, "processed");
              }}
              disabled={order.status === "processed"}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${order.status === "processed"
                ? "bg-[#d43900]/20 text-[#d43900] cursor-not-allowed"
                : "bg-[#d43900] text-white hover:bg-[#d43900]/90"
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Processing
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, "shipped");
              }}
              disabled={order.status === "shipped"}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${order.status === "shipped"
                ? "bg-black/10 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
                }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Shipped
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, "delivered");
              }}
              disabled={order.status === "delivered"}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${order.status === "delivered"
                ? "bg-[#0e540b]/20 text-[#0e540b] cursor-not-allowed"
                : "bg-[#0e540b] text-white hover:bg-[#0e540b]/90"
                }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Delivered
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, "cancelled");
              }}
              disabled={order.status === "cancelled"}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 col-span-2 ${order.status === "cancelled"
                ? "bg-red-100 text-red-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
                }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancelled
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Main Return - Layout, Header, Stats, Filters
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Order Management</h1>
              <p className="text-gray-600">Track and manage all your orders</p>
            </div>
          </div>

          {/* Modern Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <p className="text-3xl font-bold text-black">{filteredOrders.length}</p>
            </div>

            <div className="bg-gradient-to-br from-[#0e540b]/10 to-[#0e540b]/5 border border-[#0e540b]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#0e540b]" />
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
              <p className="text-3xl font-bold text-[#0e540b]">
                {filteredOrders.filter(o => o.status?.toLowerCase() === "delivered").length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#d43900]/10 to-[#d43900]/5 border border-[#d43900]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#d43900]" />
                <p className="text-sm text-gray-600">Processing</p>
              </div>
              <p className="text-3xl font-bold text-[#d43900]">
                {filteredOrders.filter(o =>
                  o.status?.toLowerCase() === "processing" ||
                  o.status?.toLowerCase() === "processed"
                ).length}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Placed</p>
              </div>
              <p className="text-3xl font-bold text-black">
                {filteredOrders.filter(o =>
                  o.status?.toLowerCase() === "placed" ||
                  o.status?.toLowerCase() === "pending"
                ).length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#0e540b]/10 to-[#0e540b]/5 border border-[#0e540b]/20 rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-[#0e540b]" />
                <p className="text-sm text-gray-600">Paid</p>
              </div>
              <p className="text-3xl font-bold text-[#0e540b]">
                {filteredOrders.filter(o =>
                  o.paymentStatus?.toLowerCase() === "completed" ||
                  o.paymentStatus?.toLowerCase() === "paid"
                ).length}
              </p>
            </div>
          </div>
        </div>

        {/* Modern Search & Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] text-sm transition-all"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] text-sm bg-white transition-all"
            >
              <option value="">All Status</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] text-sm bg-white transition-all"
            >
              <option value="">Payment Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] text-sm transition-all"
            />

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("");
                setFilterPayment("");
                setFilterDate("");
              }}
              className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Card Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))
          ) : (
            <div className="col-span-full bg-white border border-gray-200 rounded-xl p-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
        

        {/* Modern Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-black to-gray-900 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-white">Order Details</h3>
                  <p className="text-white/70 text-sm mt-0.5">{selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 overflow-y-auto max-h-[calc(95vh-180px)] space-y-6">
                {/* Order Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-black" />
                      <h4 className="font-semibold text-black">Order Info</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Order ID</p>
                        <p className="font-bold text-black">{selectedOrder.orderId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Date</p>
                        <p className="text-black">{selectedOrder.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Type</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectedOrder.orderType === "basket"
                          ? "bg-[#0e540b]/10 text-[#0e540b]"
                          : "bg-gray-100 text-gray-700"
                          }`}>
                          {selectedOrder.orderType === "basket" ? "Basket Order" : "Custom Order"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-black" />
                      <h4 className="font-semibold text-black">Customer</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Name</p>
                        <p className="font-medium text-black">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Email</p>
                        <p className="text-black break-all">{selectedOrder.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Phone</p>
                        <p className="font-medium text-black">{selectedOrder.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-black" />
                      <h4 className="font-semibold text-black">Payment</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getPaymentConfig(selectedOrder.paymentStatus).bg} ${getPaymentConfig(selectedOrder.paymentStatus).text} ${getPaymentConfig(selectedOrder.paymentStatus).border}`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Method</p>
                        <p className="font-medium text-black">{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Order Status</p>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusConfig(selectedOrder.status).bg} ${getStatusConfig(selectedOrder.status).text} ${getStatusConfig(selectedOrder.status).border}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-black" />
                    <h4 className="font-semibold text-black">Delivery Address</h4>
                  </div>
                  <p className="text-sm text-black">{selectedOrder.address}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedOrder.area}, {selectedOrder.city}, {selectedOrder.state}
                  </p>
                </div>

                {/* Coupon Section */}
                {selectedOrder.coupon && (
                  <div className="bg-gradient-to-r from-[#0e540b]/10 to-[#d43900]/10 border-2 border-[#0e540b]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-5 h-5 text-[#0e540b]" />
                      <h4 className="font-semibold text-black">Coupon Applied</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Code</p>
                        <p className="font-bold text-black uppercase">{selectedOrder.coupon.code}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Type</p>
                        <p className="text-black capitalize">{selectedOrder.coupon.discountType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Discount</p>
                        <p className="font-bold text-[#0e540b]">
                          {selectedOrder.coupon.discountType === "percentage"
                            ? `${selectedOrder.coupon.discountValue}%`
                            : `₹${selectedOrder.coupon.discountValue}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectedOrder.coupon.isActive
                          ? "bg-[#0e540b]/20 text-[#0e540b]"
                          : "bg-red-100 text-red-700"
                          }`}>
                          {selectedOrder.coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-black mb-4">Price Breakdown</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vegetables Total</span>
                      <span className="font-medium text-black">₹{selectedOrder.vegetablesTotal}</span>
                    </div>
                    {selectedOrder.offerPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Offer Price</span>
                        <span className="font-medium text-[#d43900]">₹{selectedOrder.offerPrice}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-[#0e540b]">-₹{selectedOrder.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="font-medium text-black">₹{selectedOrder.deliveryCharges}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                      <span className="text-lg font-bold text-black">Total Amount</span>
                      <span className="text-2xl font-bold text-[#0e540b]">₹{selectedOrder.amount}</span>
                    </div>
                  </div>
                </div>

                {/* Vegetables List */}
                <div>
                  <h4 className="font-semibold text-black mb-4">
                    Vegetables ({selectedOrder.vegetables.length} items)
                  </h4>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Vegetable</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Weight</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">VegBazar</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Market</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Subtotal</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Savings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.vegetables.map((veg, index) => {
                          const vegBazarPrice = veg.vegBazarPrice || 0;
                          const marketPrice = veg.marketPrice || vegBazarPrice;
                          const subtotal = veg.subtotal || 0;
                          const totalMarketPrice = marketPrice * veg.quantity;
                          const totalSavings = (totalMarketPrice - subtotal).toFixed(2);
                          const savingsPercent = marketPrice > 0
                            ? (((marketPrice - vegBazarPrice) / marketPrice) * 100).toFixed(1)
                            : 0;

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-black">{veg.name}</span>
                                  {veg.isFromBasket && (
                                    <span className="px-1.5 py-0.5 bg-[#0e540b]/10 text-[#0e540b] text-xs rounded">
                                      Basket
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">{veg.weight}</td>
                              <td className="px-4 py-3 text-center font-medium text-black">{veg.quantity}</td>
                              <td className="px-4 py-3 text-right font-medium text-black">₹{vegBazarPrice}</td>
                              <td className="px-4 py-3 text-right text-gray-600">₹{marketPrice}</td>
                              <td className="px-4 py-3 text-right font-bold text-[#0e540b]">₹{subtotal}</td>
                              <td className="px-4 py-3 text-right">
                                <span className="inline-block px-2 py-1 bg-[#0e540b]/10 text-[#0e540b] rounded text-xs font-bold">
                                  ₹{totalSavings} ({savingsPercent}%)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan="5" className="px-4 py-3 text-right text-black">Total:</td>
                          <td className="px-4 py-3 text-right text-[#0e540b]">
                            ₹{selectedOrder.vegetables.reduce((sum, v) => sum + (v.subtotal || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[#0e540b]">
                            ₹{selectedOrder.vegetables.reduce((sum, v) => {
                              const marketPrice = v.marketPrice || v.vegBazarPrice;
                              const totalMarket = marketPrice * v.quantity;
                              return sum + (totalMarket - v.subtotal);
                            }, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {selectedOrder.vegetables.map((veg, index) => {
                      const vegBazarPrice = veg.vegBazarPrice || 0;
                      const marketPrice = veg.marketPrice || vegBazarPrice;
                      const subtotal = veg.subtotal || 0;
                      const totalMarketPrice = marketPrice * veg.quantity;
                      const totalSavings = (totalMarketPrice - subtotal).toFixed(2);
                      const savingsPercent = marketPrice > 0
                        ? (((marketPrice - vegBazarPrice) / marketPrice) * 100).toFixed(1)
                        : 0;

                      return (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-black">{veg.name}</p>
                              <p className="text-sm text-gray-600">{veg.weight} × {veg.quantity}</p>
                            </div>
                            <span className="px-2 py-1 bg-[#0e540b]/10 text-[#0e540b] rounded text-xs font-bold">
                              {savingsPercent}% OFF
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600 mb-1">VegBazar Price</p>
                              <p className="font-bold text-black">₹{vegBazarPrice}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">Market Price</p>
                              <p className="text-gray-600">₹{marketPrice}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">Subtotal</p>
                              <p className="font-bold text-[#0e540b]">₹{subtotal}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">You Save</p>
                              <p className="font-bold text-[#0e540b]">₹{totalSavings}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTable;