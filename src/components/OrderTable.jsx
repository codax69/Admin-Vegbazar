import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLoading } from "../context/LoadingContext";
const OrderTable = () => {
  const { startLoading, stopLoading } = useLoading();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const OrdersApiCall = async () => {
    setLoading(true);
    startLoading()
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders`
      );
      const data = await response.data;
      const formattedOrders = data.data.map((o) => ({
        orderId: o.orderId,
        date:
          new Date(o.orderDate).toLocaleDateString() +
          " " +
          new Date(o.orderDate).toLocaleTimeString(),
        customerName: o.customerInfo?.name,
        email: o.customerInfo?.email,
        phone: o.customerInfo?.mobile,
        address: o.customerInfo?.address,
        state: o.customerInfo?.state,
        city: o.customerInfo?.city || "",
        package: o.selectedOffer?.title,
        amount: o.totalAmount,
        status: o.status || "Pending",
        paymentStatus: o.paymentStatus || "Pending", // Add payment status
        paymentMethod: o.paymentMethod || "N/A",
        items: o.selectedVegetables || [],
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
      stopLoading()
    }
  };

  useEffect(() => {
    OrdersApiCall();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{order.orderId}</h3>
          <p className="text-sm text-gray-500">{order.date}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {order.status}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
              order.paymentStatus
            )}`}
          >
            💳 {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-1">Customer</h4>
          <p className="text-sm text-gray-600">{order.customerName}</p>
          <p className="text-xs text-gray-500">{order.email}</p>
          <p className="text-xs text-gray-500">{order.phone}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-1">Location</h4>
          <p className="text-sm text-gray-600">{order.address}</p>
          <p className="text-xs text-gray-500">
            {order.city}, {order.state}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">
          Items ({order.items.length})
        </h4>
        <div className="flex flex-wrap gap-1">
          {order.items.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600">{order.package}</p>
          <p className="text-xs text-gray-500">Method: {order.paymentMethod}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">₹{order.amount}</p>
        </div>
      </div>

      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => setSelectedOrder(order)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
          Update Status
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Order Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and track all customer orders
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
            📱 Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Table
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "Delivered").length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Delivered</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === "Processing").length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Processing</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {orders.filter((o) => o.status === "Pending").length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {orders.filter((o) => o.paymentStatus === "Paid").length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Paid</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search orders..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white">
            <option value="">Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
            🔍 Search
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}

      {/* Big Comprehensive Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.orderId} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="font-medium text-gray-700 text-sm">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ₹{order.amount}
                    </span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Big Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Items Ordered
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {order.date?.split(" ")[0]} {order.date?.split(" ")[1]}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {order.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {order.address}, {order.city}, {order.state}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                      {order.package}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 max-w-64">
                        {order.items.slice(0, 4).map((item, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {item}
                          </span>
                        ))}
                        {order.items.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{order.items.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                      ₹{order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          title="Update"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Order Details
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Order Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Order ID:</span>{" "}
                      {selectedOrder.orderId}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {selectedOrder.date}
                    </p>
                    <p>
                      <span className="font-medium">Package:</span>{" "}
                      {selectedOrder.package}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span> ₹
                      {selectedOrder.amount}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Payment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Payment Status:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          selectedOrder.paymentStatus
                        )}`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Payment Method:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </p>
                    <p>
                      <span className="font-medium">Order Status:</span>{" "}
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

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedOrder.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedOrder.phone}
                  </p>
                  <p>
                    <span className="font-medium">City:</span>{" "}
                    {selectedOrder.city}, {selectedOrder.state}
                  </p>
                  <p className="col-span-2">
                    <span className="font-medium">Address:</span>{" "}
                    {selectedOrder.address}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  Items Ordered ({selectedOrder.items.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.items.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                  Mark as Delivered
                </button>
                <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm">
                  Mark as Processing
                </button>
                <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm">
                  Mark as Paid
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
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
