import React, { useEffect, useState } from "react";
import axios from "axios";
import VegetableUpdateModal from "./VegetableUpdateModal";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react";

const VegetableTable = () => {
  const { token } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { startLoading, stopLoading } = useLoading();
  const [expandedRows, setExpandedRows] = useState({});
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVegetable, setSelectedVegetable] = useState(null);

  const VegetableApiCall = async () => {
    try {
      startLoading();
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`
      );
      setVegetables(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vegetables:", error);
      setError("Failed to fetch vegetables");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vegetable?")) {
      return;
    }
    startLoading();
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await VegetableApiCall();
    } catch (error) {
      console.error("Delete failed:", error);
      setError(
        `Delete failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      stopLoading();
    }
  };

  const handleEdit = (vegetable) => {
    setSelectedVegetable(vegetable);
    setIsModalOpen(true);
    setError(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVegetable(null);
  };

  const handleVegetableUpdate = (updatedVegetable) => {
    setVegetables((prevVegetables) =>
      prevVegetables.map((veg) =>
        veg._id === updatedVegetable._id ? updatedVegetable : veg
      )
    );
  };

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    VegetableApiCall();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-[#0e540b] animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0e540b] font-bold text-xs">
            VB
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl font-sans text-gray-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tight mb-3">
            Vegetable Inventory
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Manage your product catalog, pricing, and stock availability.
          </p>
        </div>
        <button
          onClick={VegetableApiCall}
          className="mt-6 md:mt-0 px-8 py-3 bg-[#0e540b] text-white rounded-full hover:bg-[#0b4608] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl shadow-[#0e540b]/20 flex items-center gap-2 font-bold text-sm tracking-wide"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-xl text-black border border-gray-200">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-black">{vegetables.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-[#0e540b]/20 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0e540b]/10 rounded-xl text-[#0e540b] border border-[#0e540b]/20">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0e540b]/70 mb-1">In Stock</p>
              <p className="text-3xl font-bold text-[#0e540b]">
                {vegetables.filter((v) => {
                  const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                  return !v.outOfStock && (isSet ? v.stockPieces > 0 : v.stockKg > 0);
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-yellow-400/30 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl text-yellow-600 border border-yellow-400/30">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-600/70 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600">
                {vegetables.filter((v) => {
                  const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                  const stock = isSet ? v.stockPieces : v.stockKg;
                  return stock > 0 && stock <= 2;
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-[#d43900]/20 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#d43900]/10 rounded-xl text-[#d43900] border border-[#d43900]/20">
              <span className="text-xl">🚫</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#d43900]/70 mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-[#d43900]">
                {vegetables.filter((v) => {
                  const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                  return v.outOfStock || (isSet ? v.stockPieces === 0 : v.stockKg === 0);
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 rounded-xl border border-[#d43900]/20 text-[#d43900] flex justify-between items-center shadow-sm">
          <p className="ml-2 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="px-4 py-1.5 rounded-full bg-white text-[#d43900] text-sm font-bold shadow-sm hover:bg-gray-50 transition">Dismiss</button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white shadow-xl shadow-gray-200/50 border-2 border-gray-200 rounded-3xl overflow-hidden">
        {vegetables.length === 0 ? (
          <div className="text-center py-24 bg-gray-50/50">
            <div className="text-gray-400 text-xl font-medium mb-4">No inventory found</div>
            <button
              onClick={VegetableApiCall}
              className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-all rounded-full uppercase text-xs font-bold tracking-widest shadow-lg hover:shadow-xl"
            >
              Retry Fetching
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider font-semibold">Image</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider font-semibold">Name & Type</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider font-semibold">Stock Level</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider font-semibold">Base Price</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider font-semibold">Expand</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {vegetables.map((veg) => {
                  // Determine pricing model
                  const isSetModel = veg.pricingType === "set" ||
                    veg.setPricing?.enabled === true ||
                    veg.setPricingEnabled === true;

                  // Check if out of stock based on model
                  const isOutOfStock = veg.outOfStock ||
                    (isSetModel
                      ? (veg.stockPieces === 0 || veg.stockPieces == null)
                      : (veg.stockKg === 0 || veg.stockKg == null)
                    );

                  // Get stock value
                  const stockValue = isSetModel ? veg.stockPieces : veg.stockKg;

                  // Get price to display
                  const displayPrice = isSetModel
                    ? (veg.setPricing?.sets?.[0]?.price ||
                      veg.sets?.[0]?.price ||
                      veg.setOptions?.[0]?.price)
                    : (veg.prices?.weight1kg || veg.price);

                  return (
                    <React.Fragment key={veg._id}>
                      <tr className={`group transition-all duration-200 ${isOutOfStock ? "bg-red-50/30" : "hover:bg-gray-50"
                        } ${expandedRows[veg._id] ? "bg-gray-50" : ""}`}>

                        {/* Image */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative h-12 w-12 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={veg.image}
                              alt={veg.name}
                              className={`h-12 w-12 rounded-lg object-cover shadow-sm ${isOutOfStock ? "grayscale opacity-70" : ""
                                }`}
                              onError={(e) => { e.target.src = "/placeholder-vegetable.png"; }}
                            />
                            {isOutOfStock && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#d43900] rounded-full border-2 border-white"></div>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`font-medium text-base ${isOutOfStock ? "text-gray-400" : "text-black"}`}>
                            {veg.name}
                          </div>
                          {isSetModel ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 mt-1">
                              Set Item
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-500 border border-gray-200 mt-1">
                              By Weight
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-bold bg-[#d43900]/10 text-[#d43900] uppercase tracking-wider border border-[#d43900]/20">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-bold bg-[#0e540b]/10 text-[#0e540b] uppercase tracking-wider border border-[#0e540b]/20">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-mono font-medium ${stockValue <= 2 ? "text-[#d43900]" : "text-gray-600"
                            }`}>
                            {isSetModel ? `${stockValue} pcs` : `${Number(stockValue).toFixed(1)} kg`}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-black font-semibold">₹{displayPrice}</span>
                        </td>

                        {/* Expand Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => toggleRowExpand(veg._id)}
                            className="text-gray-400 hover:text-black transition-colors focus:outline-none"
                          >
                            <ChevronDown
                              size={20}
                              className={`transform transition-transform duration-300 ${expandedRows[veg._id] ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        {/* Actions */}
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleEdit(veg)}
                              className="px-4 py-2 rounded-xl text-sm font-bold text-black bg-gray-100 hover:bg-[#0e540b] hover:text-white transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(veg._id)}
                              className="p-2 rounded-xl text-gray-400 hover:bg-[#d43900]/10 hover:text-[#d43900] transition-all duration-200"
                              title="Delete"
                            >
                              <span className="text-lg">×</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedRows[veg._id] && (
                        <tr className="bg-gray-50 border-t border-gray-100 shadow-inner">
                          <td colSpan="7" className="px-6 py-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              {/* Pricing Details */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[#0e540b] mb-4 border-b border-[#0e540b]/20 pb-2">
                                  Pricing Breakdown
                                </h4>

                                {isSetModel ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    {(veg.setPricing?.sets || veg.sets || veg.setOptions || []).map((set, idx) => (
                                      <div key={idx} className="bg-white p-3 border border-gray-200 shadow-sm">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                          {set.label || `${set.quantity} ${set.unit}`}
                                        </div>
                                        <div className="flex justify-between items-end">
                                          <div className="text-lg font-bold text-black">₹{set.price}</div>
                                          {set.marketPrice && (
                                            <div className="text-xs text-gray-400 line-through">₹{set.marketPrice}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {/* VegBazar Prices */}
                                    {veg.prices && (
                                      <div className="grid grid-cols-4 gap-2">
                                        {['1kg', '500g', '250g', '100g'].map((weight) => {
                                          const key = `weight${weight}`;
                                          const price = veg.prices[key];
                                          if (!price) return null;
                                          return (
                                            <div key={key} className="bg-white p-2 border border-gray-100 text-center">
                                              <div className="text-[10px] text-gray-400 uppercase">{weight}</div>
                                              <div className="font-bold text-black text-sm">₹{price}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-4 border-b border-gray-200 pb-2">
                                  Product Details
                                </h4>
                                <div className="space-y-3 text-sm text-gray-600">
                                  {veg.description && (
                                    <div>
                                      <span className="font-semibold text-black">Description: </span>
                                      {veg.description}
                                    </div>
                                  )}
                                  {isOutOfStock && (
                                    <div className="mt-4 p-3 bg-[#d43900]/5 border border-[#d43900]/20 text-[#d43900] text-xs font-medium">
                                      Important: This item is currently marked as Out of Stock. Customers cannot purchase it.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      <VegetableUpdateModal
        vegetable={selectedVegetable}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleVegetableUpdate}
      />
    </div>
  );
};

export default VegetableTable;