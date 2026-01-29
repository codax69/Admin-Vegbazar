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
  Filter,
  ArrowRight,
  Download
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
    <div className="min-h-screen bg-gray-50/50 text-black p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">
              Sales Report
            </h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-1">
              Detailed breakdown by item and date
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-[#0e540b]">
            <Filter size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Filter Options</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]"
                />
              </div>
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]"
                />
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0e540b] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-green-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-[46px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search size={16} />
                  Generate
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}
        </div>

        {/* Global Stats */}
        {data && data.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-black text-black">{data.summary.totalOrders}</p>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Package size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-black text-[#0e540b]">₹{data.summary.totalRevenue}</p>
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-[#0e540b]">
                  <TrendingUp size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Weight</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-black text-black">{data.summary.totalVegetablesWeightKg?.toFixed(2) || 0} <span className="text-sm text-gray-400 font-bold">kg</span></p>
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Weight size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unique Items</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-black text-black">{data.summary.uniqueVegetables}</p>
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Check size={16} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Stats */}
        {selectedStats && (
          <div className="bg-[#0e540b] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                Selection Summary
              </h3>
              <button
                onClick={clearSelection}
                className="text-[10px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Clear Selection ({selectedVegetables.length})
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Weight (kg)</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalKg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Weight (g)</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalG}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Pieces</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalPieces}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Bundles</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalBundles}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Sets</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalSets}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Orders</p>
                <p className="text-xl font-bold mt-1">{selectedStats.totalOrders}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {data && data.vegetableData && (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#0e540b] focus:ring-[#0e540b] cursor-pointer"
                      />
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Item Name</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Kg</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Gram</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Pieces</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Bundles</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Sets</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(data.vegetableData).map(([vegetableName, details]) => {
                    const isSelected = selectedVegetables.includes(vegetableName);
                    return (
                      <tr
                        key={vegetableName}
                        className={`transition-colors hover:bg-gray-50 ${isSelected ? 'bg-[#0e540b]/5' : ''}`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectVegetable(vegetableName)}
                            className="w-4 h-4 rounded border-gray-300 text-[#0e540b] focus:ring-[#0e540b] cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-bold ${isSelected ? 'text-[#0e540b]' : 'text-black'}`}>
                            {vegetableName}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-600">
                          {details.totalWeightKg > 0 ? details.totalWeightKg : '-'}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-600">
                          {details.totalWeightG > 0 ? details.totalWeightG : '-'}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-600">
                          {details.totalPieces > 0 ? details.totalPieces : '-'}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-600">
                          {details.totalBundles > 0 ? details.totalBundles : '-'}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-600">
                          {details.totalSets > 0 ? details.totalSets : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-black border border-gray-200">
                            {details.orders}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State within table container if no data but table headers present is redundant, handled by main empty state below */}
          </div>
        )}

        {/* Empty State */}
        {data && Object.keys(data.vegetableData || {}).length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-1">No Results Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your date and time filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}