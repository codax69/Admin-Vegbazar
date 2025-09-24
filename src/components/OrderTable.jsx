import axios from "axios";
import React, { useEffect, useState } from "react";

const OrderTable = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
  const [orders, setOrders] = useState([]);

  const OrdersApiCall = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/orders`);
    const data = await response.data;
    console.log(data);
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
      city: o.customerInfo?.city || "", // add default if missing
      package: o.selectedOffer?.title,
      amount: o.totalAmount,
      status: o.status || "Pending", // fallback since your API doesn’t return status
      items: o.selectedVegetables || [], // array already
    }));

    setOrders(formattedOrders);
  };

  // const orders = [
  //     {
  //         orderId: 'ORD1756109117481',
  //         date: '25/08/2025 13:35:17',
  //         customerName: 'Yogeshkumar Kanubhai Patel',
  //         email: 'ykpmaths@gmail.com',
  //         phone: '9408408072',
  //         address: 'gdfgd',
  //         state: 'Gujarat',
  //         city: 'Surat',
  //         package: 'Basic Pack',
  //         amount: 100,
  //         status: 'Pending',
  //         items: ['Spinach', 'Tomato', 'Onion', 'Broccoli', 'Bell Pepper']
  //     },
  //     {
  //         orderId: 'ORD1756109117482',
  //         date: '24/08/2025 10:22:45',
  //         customerName: 'Priya Sharma',
  //         email: 'priya.sharma@gmail.com',
  //         phone: '9876543210',
  //         address: '123 Main Street',
  //         state: 'Gujarat',
  //         city: 'Ahmedabad',
  //         package: 'Premium Pack',
  //         amount: 250,
  //         status: 'Delivered',
  //         items: ['Cauliflower', 'Carrot', 'Cucumber', 'Lettuce']
  //     },
  //     {
  //         orderId: 'ORD1756109117483',
  //         date: '23/08/2025 16:45:12',
  //         customerName: 'Rajesh Kumar',
  //         email: 'rajesh.k@yahoo.com',
  //         phone: '8765432109',
  //         address: '456 Garden Road',
  //         state: 'Gujarat',
  //         city: 'Vadodara',
  //         package: 'Standard Pack',
  //         amount: 175,
  //         status: 'Processing',
  //         items: ['Potato', 'Onion', 'Ginger', 'Green Chili']
  //     }
  // ];
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

  const OrderCard = ({ order }) => (
    <div className="bg-white max-w-7xl rounded-lg shadow-md border border-gray-200 p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{order.orderId}</h3>
          <p className="text-sm text-gray-500">{order.date}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
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
    <div className="container max-w-4xl mx-auto px-4 py-4 sm:py-8">
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

        {/* View Toggle Buttons */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Card View (Mobile Friendly) */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}

      {/* Table View (Desktop) */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Table - Simplified */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.orderId} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{order.orderId}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="font-medium text-gray-700">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ₹{order.amount}
                    </span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider">
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
                    <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      <div className="whitespace-nowrap">
                        {order.date?.split(" ")[0]}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.date?.split(" ")[1]}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {order.customerName}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        <div className="truncate">{order.email}</div>
                        <div className="text-xs">{order.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        <div className="truncate">{order.address}</div>
                        <div className="text-xs">
                          {order.city}, {order.state}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {order.items?.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {item}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{order.amount}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
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
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
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

            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">
                  Order Information
                </h4>
                <div className="mt-2 space-y-1 text-sm">
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
                <h4 className="font-semibold text-gray-700">
                  Customer Information
                </h4>
                <div className="mt-2 space-y-1 text-sm">
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
                    <span className="font-medium">Address:</span>{" "}
                    {selectedOrder.address}
                  </p>
                  <p>
                    <span className="font-medium">City:</span>{" "}
                    {selectedOrder.city}, {selectedOrder.state}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700">Items Ordered</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOrder.items.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                  Mark as Delivered
                </button>
                <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm">
                  Mark as Processing
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

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
            🔍 Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:block xl:block">
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Mobile Simplified Table */}
            <div className="block sm:hidden">
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
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

            {/* Desktop Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider">
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
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                        <div>{order.date?.split(" ")[0]}</div>
                        <div className="text-xs text-gray-400">
                          {order.date?.split(" ")[1]}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div className="truncate max-w-32">{order.email}</div>
                          <div className="text-xs">{order.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div className="truncate max-w-32">
                            {order.address}
                          </div>
                          <div className="text-xs">
                            {order.city}, {order.state}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-40">
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
                      <td className="px-4 lg:px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            title="Update Status"
                          >
                            ✏️
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
      </div>
    </div>
  );
};

export default OrderTable;
