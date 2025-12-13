import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Search,
  Weight,
  TrendingUp,
  Package,
  X,
  Check,
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
  const [selectedVegetables, setSelectedVegetables] = useState(() => {
    const saved = localStorage.getItem('selectedVegetables');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectAll, setSelectAll] = useState(false);

  // Load saved search parameters on mount
  React.useEffect(() => {
    const savedStartDate = localStorage.getItem('startDate');
    const savedStartTime = localStorage.getItem('startTime');
    const savedEndDate = localStorage.getItem('endDate');
    const savedEndTime = localStorage.getItem('endTime');
    
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedStartTime) setStartTime(savedStartTime);
    if (savedEndDate) setEndDate(savedEndDate);
    if (savedEndTime) setEndTime(savedEndTime);
  }, []);

  // Save selected vegetables to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('selectedVegetables', JSON.stringify(selectedVegetables));
  }, [selectedVegetables]);

  // Save search parameters to localStorage
  React.useEffect(() => {
    if (startDate) localStorage.setItem('startDate', startDate);
    if (startTime) localStorage.setItem('startTime', startTime);
    if (endDate) localStorage.setItem('endDate', endDate);
    if (endTime) localStorage.setItem('endTime', endTime);
  }, [startDate, startTime, endDate, endTime]);

  // Update selectAll checkbox based on current selection
  React.useEffect(() => {
    if (data?.vegetableData) {
      const allVegetables = Object.keys(data.vegetableData);
      setSelectAll(
        allVegetables.length > 0 && 
        selectedVegetables.length === allVegetables.length &&
        allVegetables.every(veg => selectedVegetables.includes(veg))
      );
    }
  }, [selectedVegetables, data]);

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
        // Filter out vegetables that no longer exist in new data
        if (response.data.data.vegetableData) {
          const newVegetables = Object.keys(response.data.data.vegetableData);
          setSelectedVegetables(prev => prev.filter(veg => newVegetables.includes(veg)));
        }
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

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked && data?.vegetableData) {
      setSelectedVegetables(Object.keys(data.vegetableData));
    } else {
      setSelectedVegetables([]);
    }
  };

  const handleSelectVegetable = (vegetableName) => {
    setSelectedVegetables(prev => {
      if (prev.includes(vegetableName)) {
        return prev.filter(v => v !== vegetableName);
      } else {
        return [...prev, vegetableName];
      }
    });
  };

  const clearSelection = () => {
    setSelectedVegetables([]);
    setSelectAll(false);
  };

  const getSelectedStats = () => {
    if (!data?.vegetableData || selectedVegetables.length === 0) return null;
    
    let totalKg = 0;
    let totalG = 0;
    let totalPieces = 0;
    let totalBundles = 0;
    let totalSets = 0;
    let totalOrders = 0;

    selectedVegetables.forEach(vegName => {
      const veg = data.vegetableData[vegName];
      if (veg) {
        totalKg += veg.totalWeightKg || 0;
        totalG += veg.totalWeightG || 0;
        totalPieces += veg.totalPieces || 0;
        totalBundles += veg.totalBundles || 0;
        totalSets += veg.totalSets || 0;
        totalOrders += veg.orders || 0;
      }
    });

    return { totalKg, totalG, totalPieces, totalBundles, totalSets, totalOrders };
  };

  const selectedStats = getSelectedStats();

  return (
    <div className="min-h-screen bg-gray-50 text-black p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: "#0e540b" }}>
            Orders Report
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Search orders by date and time range</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Clock className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Clock className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#0e540b" }}
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#0e540b" }}
          >
            <Search className="inline w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            {loading ? "Searching..." : "Search Orders"}
          </button>

          {error && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 text-sm bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {data && data.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div
              className="bg-white rounded-lg p-3 sm:p-4 border-l-4 shadow-sm"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-gray-600">Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">
                    {data.summary.totalOrders}
                  </p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 hidden sm:block" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-3 sm:p-4 border-l-4 shadow-sm"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">
                    ₹{data.summary.totalRevenue}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 hidden sm:block" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-3 sm:p-4 border-l-4 shadow-sm"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-gray-600">Weight</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">
                    {data.summary.totalVegetablesWeightKg?.toFixed(2) || 0} kg
                  </p>
                </div>
                <Weight className="w-6 h-6 sm:w-8 sm:h-8 hidden sm:block" style={{ color: "#0e540b" }} />
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-3 sm:p-4 border-l-4 shadow-sm"
              style={{ borderColor: "#0e540b" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-gray-600">Items</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">
                    {data.summary.uniqueVegetables}
                  </p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 hidden sm:block" style={{ color: "#0e540b" }} />
              </div>
            </div>
          </div>
        )}

        {/* Vegetable Summary Table - Desktop */}
        {data && data.vegetableData && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: "#0e540b" }}>
                <h2 className="text-xl font-bold text-white">
                  Vegetable Summary
                </h2>
                <div className="flex items-center gap-3">
                  {selectedVegetables.length > 0 && (
                    <>
                      <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        {selectedVegetables.length} selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-white text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedStats && (
                <div className="px-6 py-4 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Items Total:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Weight: </span>
                      <span className="font-semibold text-black">{selectedStats.totalKg} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Weight: </span>
                      <span className="font-semibold text-black">{selectedStats.totalG} g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pieces: </span>
                      <span className="font-semibold text-black">{selectedStats.totalPieces}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Bundles: </span>
                      <span className="font-semibold text-black">{selectedStats.totalBundles}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sets: </span>
                      <span className="font-semibold text-black">{selectedStats.totalSets}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Orders: </span>
                      <span className="font-semibold text-black">{selectedStats.totalOrders}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: "#0e540b" }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Vegetable Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Weight (g)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Pieces
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Bundles
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Sets
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(data.vegetableData).map(
                      ([vegetableName, details], index) => (
                        <tr
                          key={vegetableName}
                          className={
                            selectedVegetables.includes(vegetableName)
                              ? "bg-green-50 hover:bg-green-100"
                              : index % 2 === 0
                              ? "bg-white hover:bg-gray-50"
                              : "bg-gray-50 hover:bg-gray-100"
                          }
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedVegetables.includes(vegetableName)}
                              onChange={() => handleSelectVegetable(vegetableName)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-black">
                            {vegetableName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.totalWeightKg > 0 ? `${details.totalWeightKg} kg` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.totalWeightG > 0 ? `${details.totalWeightG} g` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.totalPieces > 0 ? details.totalPieces : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.totalBundles > 0 ? details.totalBundles : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.totalSets > 0 ? details.totalSets : '-'}
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              <div className="bg-white rounded-lg p-4 border-b-4 border-gray-200" style={{ borderBottomColor: "#0e540b" }}>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold" style={{ color: "#0e540b" }}>
                    Vegetables
                  </h2>
                  {selectedVegetables.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#0e540b", color: "white" }}>
                        {selectedVegetables.length}
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {selectedStats && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Selected Total:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Kg: </span>
                        <span className="font-semibold">{selectedStats.totalKg}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Orders: </span>
                        <span className="font-semibold">{selectedStats.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </div>
              </div>

              {Object.entries(data.vegetableData).map(([vegetableName, details]) => (
                <div
                  key={vegetableName}
                  className={`rounded-lg p-4 border-l-4 shadow-sm ${
                    selectedVegetables.includes(vegetableName)
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedVegetables.includes(vegetableName)}
                        onChange={() => handleSelectVegetable(vegetableName)}
                        className="w-5 h-5 cursor-pointer mt-0.5"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-black text-sm mb-2">
                          {vegetableName}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {details.totalWeightKg > 0 && (
                            <div className="flex items-center gap-1">
                              <Weight className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">{details.totalWeightKg} kg</span>
                            </div>
                          )}
                          {details.totalPieces > 0 && (
                            <div>
                              <span className="text-gray-600">Pieces: </span>
                              <span className="font-medium text-black">{details.totalPieces}</span>
                            </div>
                          )}
                          {details.totalBundles > 0 && (
                            <div>
                              <span className="text-gray-600">Bundles: </span>
                              <span className="font-medium text-black">{details.totalBundles}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{details.orders} orders</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {data && Object.keys(data.vegetableData || {}).length === 0 && (
          <div className="bg-white rounded-lg p-8 sm:p-12 text-center border border-gray-200">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1 sm:mb-2">
              No Orders Found
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              No orders found in the specified date-time range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}