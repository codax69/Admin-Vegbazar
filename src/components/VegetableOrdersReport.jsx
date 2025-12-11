import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Search,
  Weight,
  TrendingUp,
  Package,
} from "lucide-react";
import axios from "axios";

export default function VegetableOrdersReport() {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/orders/date-range`,
        {
          params: {
            startDate,
            startTime,
            endDate,
            endTime,
          },
        }
      );

      if (response.data.success) {
        setData(response.data.data);
        
        setError("");
      } else {
        setError(response.data.message || "Failed to fetch data");
        setData(null);
      }
    } catch (err) {
      console.error("Axios error:", err);
      setError(err.response?.data?.message || "Error connecting to server");
      setData(null);
    } finally {
      setLoading(false);
    }
  };
console.log(data)
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#0e540b" }}>
            Vegetable Orders Report
          </h1>
          <p className="text-gray-400">Search orders by date and time range</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 text-white rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#0e540b" }}
          >
            <Search className="inline w-4 h-4 mr-2" />
            {loading ? "Searching..." : "Search Orders"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {data && data.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-black">
                    {data.summary.totalOrders}
                  </p>
                </div>
                <Package className="w-8 h-8" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-black">
                    ₹{data.summary.totalRevenue}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Weight</p>
                  <p className="text-2xl font-bold text-black">
                    {data.summary.totalVegetablesWeight.toFixed(2)} kg
                  </p>
                </div>
                <Weight className="w-8 h-8" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Vegetables</p>
                  <p className="text-2xl font-bold text-black">
                    {data.summary.uniqueVegetables}
                  </p>
                </div>
                <Package className="w-8 h-8" style={{ color: "#0e540b" }} />
              </div>
            </div>
          </div>
        )}

        {/* Vegetable Weights Table */}
        {data && data.vegetableWeights && (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="px-6 py-4" style={{ backgroundColor: "#0e540b" }}>
              <h2 className="text-xl font-bold text-white">
                Vegetable Weights Summary
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "#0e540b" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Vegetable Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Total Weight (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Total Weight (g)
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Number of Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(data.vegetableWeights).map(
                    ([vegetableName, details], index) => (
                      <tr
                        key={vegetableName}
                        className={
                          index % 2 === 0
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                      >
                        <td className="px-6 py-4 text-sm font-medium text-black">
                          {vegetableName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {details.totalWeightKg} kg
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {details.totalWeightG} g
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {details.orders}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {data && Object.keys(data.vegetableWeights || {}).length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-500">
              No orders found in the specified date-time range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
