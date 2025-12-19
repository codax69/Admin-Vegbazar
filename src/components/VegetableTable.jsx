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
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e540b]"></div>
          <div className="ml-3 text-lg">Loading vegetables...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Vegetable Stock Levels
          </h2>
          <button
            onClick={VegetableApiCall}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {vegetables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No vegetables found</div>
            <button
              onClick={VegetableApiCall}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    VegBazar Price
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Details
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
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
                      <tr className={`transition-colors duration-150 ${
                        isOutOfStock ? "bg-red-50" : "hover:bg-gray-50"
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <img
                              src={veg.image}
                              alt={veg.name}
                              className={`h-12 w-12 rounded-full object-cover border ${
                                isOutOfStock ? "grayscale opacity-60" : ""
                              }`}
                              onError={(e) => {
                                e.target.src = "/placeholder-vegetable.png";
                              }}
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                                  OUT
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isOutOfStock ? "text-gray-500" : "text-gray-900"
                        }`}>
                          {veg.name}
                          {isSetModel && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              📦 Set
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-red-600 text-white">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        {/* Stock Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full
                                ${
                                  stockValue === 0 || stockValue == null
                                    ? "bg-red-600 text-white"
                                    : stockValue >= 10
                                    ? "bg-green-100 text-green-800"
                                    : stockValue >= 2
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                            >
                              {isSetModel 
                                ? `${stockValue || 0} pieces`
                                : `${(stockValue || 0).toFixed(1)} kg`
                              }
                            </span>
                            {stockValue > 0 && stockValue <= 2 && (
                              <span className="text-red-500 text-xs">Low Stock!</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                          isOutOfStock ? "text-gray-400" : "text-green-600"
                        }`}>
                          {displayPrice ? `₹${displayPrice}` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => toggleRowExpand(veg._id)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition"
                            title="View all details"
                          >
                            <ChevronDown
                              size={18}
                              className={`transform transition-transform ${
                                expandedRows[veg._id] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(veg)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition text-sm"
                              title="Edit all details"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(veg._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition text-sm"
                              title="Delete vegetable"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedRows[veg._id] && (
                        <tr className={isOutOfStock ? "bg-red-50" : "bg-gray-50"}>
                          <td colSpan="9" className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Out of Stock Warning */}
                              {isOutOfStock && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                  <p className="font-bold">⚠️ This vegetable is currently out of stock</p>
                                  <p className="text-sm">Update the stock to make it available again.</p>
                                </div>
                              )}

                              {/* SET MODEL DISPLAY */}
                              {isSetModel ? (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">
                                    📦 Set Options
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(veg.setPricing?.sets || veg.sets || veg.setOptions || []).map((set, idx) => (
                                      <div
                                        key={idx}
                                        className={`p-4 rounded-lg border ${
                                          isOutOfStock
                                            ? "bg-gray-100 border-gray-300"
                                            : "bg-blue-50 border-blue-200"
                                        }`}
                                      >
                                        <p className="text-sm font-semibold text-gray-800 mb-2">
                                          {set.label || `${set.quantity} ${set.unit}`}
                                        </p>
                                        <div className="space-y-1">
                                          <p className={`text-lg font-bold ${
                                            isOutOfStock ? "text-gray-500" : "text-blue-600"
                                          }`}>
                                            ₹{set.price}
                                          </p>
                                          {set.marketPrice && set.marketPrice > 0 && (
                                            <>
                                              <p className={`text-sm ${
                                                isOutOfStock ? "text-gray-400" : "text-gray-600"
                                              }`}>
                                                Market: ₹{set.marketPrice}
                                              </p>
                                              <p className={`text-xs font-semibold ${
                                                isOutOfStock ? "text-gray-400" : "text-green-600"
                                              }`}>
                                                Save: ₹{(set.marketPrice - set.price).toFixed(2)}
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                // WEIGHT MODEL DISPLAY
                                <>
                                  {/* VegBazar Prices */}
                                  {veg.prices && (
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">
                                        VegBazar Prices
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {veg.prices.weight1kg > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-blue-50 border-blue-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">1 kg</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-blue-600"
                                            }`}>
                                              ₹{veg.prices.weight1kg}
                                            </p>
                                          </div>
                                        )}
                                        {veg.prices.weight500g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-blue-50 border-blue-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">500g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-blue-600"
                                            }`}>
                                              ₹{veg.prices.weight500g}
                                            </p>
                                          </div>
                                        )}
                                        {veg.prices.weight250g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-blue-50 border-blue-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">250g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-blue-600"
                                            }`}>
                                              ₹{veg.prices.weight250g}
                                            </p>
                                          </div>
                                        )}
                                        {veg.prices.weight100g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-blue-50 border-blue-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">100g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-blue-600"
                                            }`}>
                                              ₹{veg.prices.weight100g}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Market Prices */}
                                  {veg.marketPrices && (
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">
                                        Market Prices (Reference)
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {veg.marketPrices.weight1kg > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-green-50 border-green-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">1 kg</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-green-600"
                                            }`}>
                                              ₹{veg.marketPrices.weight1kg}
                                            </p>
                                          </div>
                                        )}
                                        {veg.marketPrices.weight500g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-green-50 border-green-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">500g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-green-600"
                                            }`}>
                                              ₹{veg.marketPrices.weight500g}
                                            </p>
                                          </div>
                                        )}
                                        {veg.marketPrices.weight250g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-green-50 border-green-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">250g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-green-600"
                                            }`}>
                                              ₹{veg.marketPrices.weight250g}
                                            </p>
                                          </div>
                                        )}
                                        {veg.marketPrices.weight100g > 0 && (
                                          <div className={`p-3 rounded border ${
                                            isOutOfStock 
                                              ? "bg-gray-100 border-gray-300" 
                                              : "bg-green-50 border-green-200"
                                          }`}>
                                            <p className="text-xs text-gray-600">100g</p>
                                            <p className={`text-lg font-bold ${
                                              isOutOfStock ? "text-gray-500" : "text-green-600"
                                            }`}>
                                              ₹{veg.marketPrices.weight100g}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Savings */}
                                  {!isOutOfStock && veg.prices?.weight1kg > 0 && veg.marketPrices?.weight1kg > 0 && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                      <p className="text-sm font-semibold text-yellow-800">
                                        Savings Comparison (1kg): ₹
                                        {(veg.marketPrices.weight1kg - veg.prices.weight1kg).toFixed(2)}
                                        {" "}(
                                        {(((veg.marketPrices.weight1kg - veg.prices.weight1kg) / veg.marketPrices.weight1kg) * 100).toFixed(1)}%)
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Description */}
                              {veg.description && (
                                <div className={`p-3 rounded ${
                                  isOutOfStock ? "bg-gray-100" : "bg-gray-100"
                                }`}>
                                  <p className="text-sm text-gray-700">
                                    <strong>Description:</strong> {veg.description}
                                  </p>
                                </div>
                              )}
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

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">
              Total Vegetables
            </div>
            <div className="text-2xl font-bold text-green-800">
              {vegetables.length}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">
              Available in Stock
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {vegetables.filter((v) => {
                const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                return !v.outOfStock && (isSet ? v.stockPieces > 0 : v.stockKg > 0);
              }).length}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">
              Low Stock Items
            </div>
            <div className="text-2xl font-bold text-yellow-800">
              {vegetables.filter((v) => {
                const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                const stock = isSet ? v.stockPieces : v.stockKg;
                return stock > 0 && stock <= 2;
              }).length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Out of Stock</div>
            <div className="text-2xl font-bold text-red-800">
              {vegetables.filter((v) => {
                const isSet = v.pricingType === "set" || v.setPricing?.enabled || v.setPricingEnabled;
                return v.outOfStock || (isSet ? v.stockPieces === 0 : v.stockKg === 0);
              }).length}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <VegetableUpdateModal
        vegetable={selectedVegetable}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleVegetableUpdate}
      />
    </>
  );
};

export default VegetableTable;