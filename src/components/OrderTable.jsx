// Part 1/3 - OrderTable.jsx (imports + state + API + helpers + OrderCard + StatusUpdateModal)
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-hot-toast";

const OrderTable = () => {
  const { startLoading, stopLoading } = useLoading();
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
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders`
      );
      const data = response.data?.data?.orders || [];

      const formattedOrders = data.map((o) => ({
        _id: o._id,
        orderId: o.orderId,
        date:
          new Date(o.orderDate).toLocaleDateString() +
          " " +
          new Date(o.orderDate).toLocaleTimeString(),
        customerName: o.customerInfo?.name || "N/A",
        email: o.customerInfo?.email || "N/A",
        phone: o.customerInfo?.mobile || "N/A",
        address: o.customerInfo?.address || "N/A",
        state: o.customerInfo?.state || "N/A",
        city: o.customerInfo?.city || "N/A",
        area: o.customerInfo?.area || "N/A",
        package:
          o.orderType === "basket" ? o.selectedOffer?.title : "Custom Order",
        amount: o.totalAmount || 0,
        vegetablesTotal: o.vegetablesTotal || 0,
        offerPrice: o.offerPrice || 0,
        deliveryCharges: o.deliveryCharges || 0,
        discount: o.discount || 0,
        // Option B: Coupon support (partial fields)
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

  // UI color helpers
  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
      case "processed":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "placed":
      case "pending":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Order Card component (Cards view)
  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
            {order.orderId}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">{order.date}</p>
          <p className="text-xs text-gray-600 mt-1">
            {order.orderType === "basket" ? "🎁 Basket" : "🛒 Custom"}
          </p>
        </div>
        <div className="flex flex-col gap-1 ml-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
              order.status
            )}`}
          >
            {order.status}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPaymentStatusColor(
              order.paymentStatus
            )}`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Customer</h4>
          <p className="text-sm text-gray-600 truncate">{order.customerName}</p>
          <p className="text-xs text-gray-500 truncate">{order.email}</p>
          <p className="text-xs text-gray-500">{order.phone}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Location</h4>
          <p className="text-sm text-gray-600 truncate">{order.address}</p>
          <p className="text-xs text-gray-500 truncate">
            {order.area}, {order.city}, {order.state}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">
          Items ({order.items.length})
        </h4>
        <div className="flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
            >
              {item}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{order.items.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 truncate">{order.package}</p>
          <p className="text-xs text-gray-500">Method: {order.paymentMethod}</p>
        </div>
        <div className="text-right ml-2">
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            ₹{order.amount}
          </p>
        </div>
      </div>

      {/* Coupon (Option B) displayed on card */}
      {order.coupon && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            <strong className="uppercase">{order.coupon.code}</strong>
            <span className="text-xs">
              {order.coupon.discountType === "percentage"
                ? `${order.coupon.discountValue}%`
                : `₹${order.coupon.discountValue}`}
            </span>
            {order.coupon.maxDiscount ? (
              <span className="ml-1 text-xs">
                max ₹{order.coupon.maxDiscount}
              </span>
            ) : null}
            <span className="ml-2 text-xs">
              {order.coupon.isActive ? "Active" : "Inactive"}
            </span>
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setSelectedOrder(order)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => {
            setSelectedOrderForUpdate(order);
            setShowStatusModal(true);
          }}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
        >
          Update Status
        </button>
      </div>
    </div>
  );

  // Status Update Modal component
  const StatusUpdateModal = () => {
    if (!showStatusModal || !selectedOrderForUpdate) return null;

    const statusOptions = [
      { value: "placed", label: "Placed", color: "bg-indigo-600" },
      { value: "processed", label: "Processing", color: "bg-yellow-600" },
      { value: "shipped", label: "Shipped", color: "bg-blue-600" },
      { value: "delivered", label: "Delivered", color: "bg-green-600" },
      { value: "cancelled", label: "Cancelled", color: "bg-red-600" },
    ];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Update Order Status
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              Order ID: {selectedOrderForUpdate.orderId}
            </p>
          </div>

          <div className="px-4 sm:px-6 py-4">
            <p className="text-sm text-gray-600 mb-4">
              Current Status:{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  selectedOrderForUpdate.status
                )}`}
              >
                {selectedOrderForUpdate.status}
              </span>
            </p>

            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    updateOrderStatus(selectedOrderForUpdate._id, option.value)
                  }
                  disabled={selectedOrderForUpdate.status === option.value}
                  className={`w-full px-4 py-3 ${option.color} text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base`}
                >
                  {option.label}
                  {selectedOrderForUpdate.status === option.value &&
                    " (Current)"}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedOrderForUpdate(null);
              }}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  // Part 2/3 - OrderTable.jsx (main layout + stats + search + cards + table views)
  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Order Management
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage and track all orders
          </p>
        </div>

        <div className="flex bg-gray-200 rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Table
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {filteredOrders.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {
                filteredOrders.filter(
                  (o) => o.status?.toLowerCase() === "delivered"
                ).length
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Delivered</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {
                filteredOrders.filter(
                  (o) =>
                    o.status?.toLowerCase() === "processing" ||
                    o.status?.toLowerCase() === "processed"
                ).length
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Processing</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {
                filteredOrders.filter(
                  (o) =>
                    o.status?.toLowerCase() === "placed" ||
                    o.status?.toLowerCase() === "pending"
                ).length
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Placed</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border col-span-2 sm:col-span-1">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
              {
                filteredOrders.filter(
                  (o) =>
                    o.paymentStatus?.toLowerCase() === "completed" ||
                    o.paymentStatus?.toLowerCase() === "paid"
                ).length
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Paid</p>
          </div>
        </div>
      </div>
      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("");
              setFilterPayment("");
              setFilterDate("");
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {/* Card View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
            </div>
          )}
        </div>
      )}
      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  {/* Coupon column (Option B) */}
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Coupon
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                        {order.orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {order.date?.split(" ")[0]}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {order.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap max-w-xs truncate">
                        {order.area}, {order.city}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                        {order.package}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {order.items.slice(0, 2).map((item, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                            >
                              {item}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{order.items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                        ₹{order.amount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      {/* Coupon cell */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.coupon ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {order.coupon.code}{" "}
                            {order.coupon.discountType === "percentage"
                              ? `${order.coupon.discountValue}%`
                              : `₹${order.coupon.discountValue}`}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrderForUpdate(order);
                              setShowStatusModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Table View */}
          <div className="block lg:hidden divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="p-3 sm:p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="font-medium text-gray-700 text-sm truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </div>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-base sm:text-lg font-bold text-green-600">
                      ₹{order.amount}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.coupon ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {order.coupon.code}{" "}
                          {order.coupon.discountType === "percentage"
                            ? `${order.coupon.discountValue}%`
                            : `₹${order.coupon.discountValue}`}
                        </span>
                      ) : null}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderForUpdate(order);
                            setShowStatusModal(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Status Update Modal */}
      <StatusUpdateModal />
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-4 max-h-[95vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-xl font-bold text-white truncate pr-2">
                  Order - {selectedOrder.orderId}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:text-gray-200 text-2xl sm:text-3xl font-bold flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-3 flex items-center">
                    <span className="text-blue-600 mr-2">📋</span> Order Info
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p>
                      <span className="font-medium text-gray-600">
                        Order ID:
                      </span>{" "}
                      <span className="font-bold text-gray-900">
                        {selectedOrder.orderId}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Date:</span>{" "}
                      {selectedOrder.date}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Type:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedOrder.orderType === "basket"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selectedOrder.orderType === "basket"
                          ? "Basket Order"
                          : "Custom Order"}
                      </span>
                    </p>
                    <p className="break-words">
                      <span className="font-medium text-gray-600">
                        Package:
                      </span>{" "}
                      {selectedOrder.package}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-3 flex items-center">
                    <span className="text-green-600 mr-2">💳</span> Payment
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p>
                      <span className="font-medium text-gray-600">
                        Payment Status:
                      </span>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          selectedOrder.paymentStatus
                        )}`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Method:</span>{" "}
                      <span className="font-bold">
                        {selectedOrder.paymentMethod}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">
                        Order Status:
                      </span>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon Section (Option B) */}
              {selectedOrder.coupon && (
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-sm sm:text-base text-purple-800 mb-3">
                    🎟️ Coupon Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <p>
                      <span className="font-medium">Code:</span>{" "}
                      <span className="font-bold">
                        {selectedOrder.coupon.code}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedOrder.coupon.discountType}
                    </p>
                    <p>
                      <span className="font-medium">Value:</span>{" "}
                      {selectedOrder.coupon.discountType === "percentage"
                        ? `${selectedOrder.coupon.discountValue}%`
                        : `₹${selectedOrder.coupon.discountValue}`}
                    </p>
                    <p>
                      <span className="font-medium">Max Discount:</span> ₹
                      {selectedOrder.coupon.maxDiscount || 0}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.coupon.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedOrder.coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-3 flex items-center">
                  <span className="text-orange-600 mr-2">👤</span> Customer
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <p className="break-words">
                    <span className="font-medium text-gray-600">Name:</span>{" "}
                    <span className="font-bold">
                      {selectedOrder.customerName}
                    </span>
                  </p>
                  <p className="break-all">
                    <span className="font-medium text-gray-600">Email:</span>{" "}
                    {selectedOrder.email}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Phone:</span>{" "}
                    <span className="font-bold">{selectedOrder.phone}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">City:</span>{" "}
                    {selectedOrder.city}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Area:</span>{" "}
                    {selectedOrder.area}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">State:</span>{" "}
                    {selectedOrder.state}
                  </p>
                  <p className="col-span-1 sm:col-span-2 break-words">
                    <span className="font-medium text-gray-600">Address:</span>{" "}
                    {selectedOrder.address}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">💰</span> Price
                  Breakdown
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vegetables Total:</span>
                    <span className="font-bold">
                      ₹{selectedOrder.vegetablesTotal}
                    </span>
                  </div>
                  {selectedOrder.offerPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Offer Price:</span>
                      <span className="font-bold text-purple-600">
                        ₹{selectedOrder.offerPrice}
                      </span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-bold text-green-600">
                        -₹{selectedOrder.discount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges:</span>
                    <span className="font-bold">
                      ₹{selectedOrder.deliveryCharges}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-green-300">
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      Total:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      ₹{selectedOrder.amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vegetables Details */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">🥬</span>
                  Vegetables ({selectedOrder.vegetables.length} items)
                </h4>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border border-gray-300">
                          Vegetable
                        </th>
                        <th className="px-3 py-2 text-center font-semibold border border-gray-300">
                          Weight
                        </th>
                        <th className="px-3 py-2 text-center font-semibold border border-gray-300">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border border-gray-300">
                          VegBazar
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border border-gray-300">
                          Market
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border border-gray-300">
                          Subtotal
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border border-gray-300">
                          Save
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border border-gray-300">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.vegetables.map((veg, index) => {
                        const vegBazarPrice = veg.vegBazarPrice || 0;
                        const marketPrice = veg.marketPrice || vegBazarPrice;
                        const subtotal = veg.subtotal || 0;
                        const savings = (marketPrice - vegBazarPrice).toFixed(
                          2
                        );
                        const totalMarketPrice = (
                          marketPrice * veg.quantity
                        ).toFixed(2);
                        const totalSavings = (
                          totalMarketPrice - subtotal
                        ).toFixed(2);
                        const savingsPercent =
                          marketPrice > 0
                            ? ((savings / marketPrice) * 100).toFixed(1)
                            : 0;

                        return (
                          <tr
                            key={index}
                            className="border border-gray-300 hover:bg-green-50"
                          >
                            <td className="px-3 py-2 font-medium text-gray-800 border border-gray-300">
                              {veg.name}
                              {veg.isFromBasket && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  🎁 Basket
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-gray-700 border border-gray-300">
                              {veg.weight}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-gray-800 border border-gray-300">
                              {veg.quantity}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-blue-600 border border-gray-300">
                              ₹{vegBazarPrice}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              ₹{marketPrice}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-green-700 border border-gray-300">
                              ₹{subtotal}
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-xs">
                                ₹{totalSavings}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-bold text-xs">
                                {savingsPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-bold text-sm">
                        <td
                          colSpan="5"
                          className="px-3 py-2 text-right border border-gray-300"
                        >
                          Total:
                        </td>
                        <td className="px-3 py-2 text-right text-green-700 border border-gray-300">
                          ₹
                          {selectedOrder.vegetables
                            .reduce((sum, v) => sum + (v.subtotal || 0), 0)
                            .toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-green-700 border border-gray-300">
                          ₹
                          {selectedOrder.vegetables
                            .reduce((sum, v) => {
                              const marketPrice =
                                v.marketPrice || v.vegBazarPrice;
                              const totalMarket = marketPrice * v.quantity;
                              const savings = totalMarket - v.subtotal;
                              return sum + savings;
                            }, 0)
                            .toFixed(2)}
                        </td>
                        <td className="px-3 py-2 border border-gray-300"></td>
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
                    const savings = (marketPrice - vegBazarPrice).toFixed(2);
                    const totalMarketPrice = (
                      marketPrice * veg.quantity
                    ).toFixed(2);
                    const totalSavings = (totalMarketPrice - subtotal).toFixed(
                      2
                    );
                    const savingsPercent =
                      marketPrice > 0
                        ? ((savings / marketPrice) * 100).toFixed(1)
                        : 0;

                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg border-2 border-green-200 shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm sm:text-base break-words">
                              {veg.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {veg.weight} × {veg.quantity}
                              {veg.isFromBasket && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  🎁
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-green-600 font-bold text-lg sm:text-xl ml-2">
                            {savingsPercent}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="bg-white p-2 sm:p-3 rounded-lg border border-blue-200">
                            <p className="text-gray-600 text-xs mb-1">
                              VegBazar
                            </p>
                            <p className="text-sm sm:text-base font-bold text-blue-600">
                              ₹{vegBazarPrice}
                            </p>
                          </div>
                          <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-300">
                            <p className="text-gray-600 text-xs mb-1">Market</p>
                            <p className="text-sm sm:text-base font-bold text-gray-700">
                              ₹{marketPrice}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="bg-green-700 p-2 sm:p-3 rounded-lg">
                            <p className="text-white text-xs mb-1">Subtotal</p>
                            <p className="text-base sm:text-lg font-bold text-white">
                              ₹{subtotal}
                            </p>
                          </div>
                          <div className="bg-green-600 p-2 sm:p-3 rounded-lg">
                            <p className="text-white text-xs mb-1">You Save</p>
                            <p className="text-base sm:text-lg font-bold text-white">
                              ₹{totalSavings}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total Savings Card */}
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 sm:p-4 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center text-white">
                      <div>
                        <p className="text-xs sm:text-sm opacity-90">
                          Total Saved
                        </p>
                        <p className="text-xl sm:text-2xl font-bold">
                          ₹
                          {selectedOrder.vegetables
                            .reduce((sum, v) => {
                              const marketPrice =
                                v.marketPrice || v.vegBazarPrice;
                              const totalMarket = marketPrice * v.quantity;
                              const savings = totalMarket - v.subtotal;
                              return sum + savings;
                            }, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm opacity-90">
                          Your Total
                        </p>
                        <p className="text-lg sm:text-xl font-bold">
                          ₹
                          {selectedOrder.vegetables
                            .reduce((sum, v) => sum + (v.subtotal || 0), 0)
                            .toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <button
                  onClick={() =>
                    handleQuickStatusUpdate(selectedOrder, "delivered")
                  }
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  Delivered
                </button>
                <button
                  onClick={() =>
                    handleQuickStatusUpdate(selectedOrder, "processed")
                  }
                  className="px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  Processing
                </button>
                <button
                  onClick={() =>
                    updatePaymentStatus(selectedOrder._id, "completed")
                  }
                  className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-xs sm:text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
