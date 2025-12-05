import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const VegetableUpdateModal = ({ vegetable, isOpen, onClose, onUpdate }) => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    vegBazarPrice1kg: "",
    marketPrice1kg: "",
    stockKg: "",
    description: "",
    image: "",
    offer: "",
    screenNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when vegetable changes
  useEffect(() => {
    if (vegetable) {
      setFormData({
        name: vegetable.name || "",
        vegBazarPrice1kg: vegetable.prices?.weight1kg || "",
        marketPrice1kg: vegetable.marketPrices?.weight1kg || "",
        stockKg: vegetable.stockKg || "",
        description: vegetable.description || "",
        image: vegetable.image || "",
        offer: vegetable.offer || "",
        screenNumber: vegetable.screenNumber || "",
      });
    }
  }, [vegetable]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const vPrice = parseFloat(formData.vegBazarPrice1kg);
    const mPrice = parseFloat(formData.marketPrice1kg);
    const stock = parseFloat(formData.stockKg);
    
    const vegBazarPrices = vPrice > 0 ? {
      weight1kg: Math.round(vPrice * 100) / 100,
      weight500g: Math.round((vPrice / 2) * 100) / 100,
      weight250g: Math.round((vPrice / 4) * 100) / 100,
      weight100g: Math.round((vPrice / 10) * 100) / 100,
    } : null;

    const marketPrices = mPrice > 0 ? {
      weight1kg: Math.round(mPrice * 100) / 100,
      weight500g: Math.round((mPrice / 2) * 100) / 100,
      weight250g: Math.round((mPrice / 4) * 100) / 100,
      weight100g: Math.round((mPrice / 10) * 100) / 100,
    } : null;

    const savings = (vPrice > 0 && mPrice > 0) ? {
      amount: (mPrice - vPrice).toFixed(2),
      percentage: (((mPrice - vPrice) / mPrice) * 100).toFixed(1),
      ratio: (mPrice / vPrice).toFixed(2)
    } : null;

    return {
      vegBazarPrices,
      marketPrices,
      savings,
      isOutOfStock: stock <= 0,
      isLowStock: stock > 0 && stock < 5,
    };
  }, [formData.vegBazarPrice1kg, formData.marketPrice1kg, formData.stockKg]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const markOutOfStock = useCallback(() => {
    setFormData(prev => ({ ...prev, stockKg: "0" }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.vegBazarPrice1kg || parseFloat(formData.vegBazarPrice1kg) <= 0)
      errors.push("Valid VegBazar price is required");
    if (!formData.marketPrice1kg || parseFloat(formData.marketPrice1kg) <= 0)
      errors.push("Valid Market price is required");
    if (formData.stockKg === "" || parseFloat(formData.stockKg) < 0)
      errors.push("Stock cannot be negative");
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Check if vegetable exists
    if (!vegetable?._id) {
      setError("No vegetable selected for update");
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    startLoading();
    setLoading(true);
    setError(null);

    try {
      const stockValue = parseFloat(formData.stockKg);
      const updateData = {
        name: formData.name.trim(),
        price1kg: parseFloat(formData.vegBazarPrice1kg),
        marketPrice1kg: parseFloat(formData.marketPrice1kg),
        stockKg: stockValue,
        outOfStock: stockValue <= 0,
        description: formData.description.trim(),
        image: formData.image.trim(),
        offer: formData.offer.trim(),
        screenNumber: formData.screenNumber,
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${vegetable._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Failed to update vegetable");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [formData, validateForm, vegetable, token, onUpdate, onClose, startLoading, stopLoading]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  // Show error state if no vegetable data
  if (!vegetable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">No vegetable data available to update</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Update Vegetable</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {calculations.isOutOfStock && (
            <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-lg flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-orange-800">Out of Stock</p>
                <p className="text-sm text-orange-700">Not available for purchase</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VegBazar Price (1kg) ₹ *</label>
                <input
                  type="number"
                  name="vegBazarPrice1kg"
                  value={formData.vegBazarPrice1kg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Other weights calculated automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Market Price (1kg) ₹ *</label>
                <input
                  type="number"
                  name="marketPrice1kg"
                  value={formData.marketPrice1kg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Other weights calculated automatically</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Stock (kg) *</label>
                  <button
                    type="button"
                    onClick={markOutOfStock}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition font-medium"
                  >
                    Mark Out of Stock
                  </button>
                </div>
                <input
                  type="number"
                  name="stockKg"
                  value={formData.stockKg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    calculations.isOutOfStock 
                      ? "border-red-300 bg-red-50 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  required
                />
                {calculations.isOutOfStock && (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Out of Stock</p>
                )}
                {calculations.isLowStock && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Low Stock - Only {formData.stockKg}kg</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offer</label>
                <input
                  type="text"
                  name="offer"
                  value={formData.offer}
                  onChange={handleInputChange}
                  placeholder="e.g., 10% off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Screen Number</label>
                <input
                  type="text"
                  name="screenNumber"
                  value={formData.screenNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1-5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.image && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <div className="border border-gray-300 rounded-md p-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md mx-auto"
                      onError={(e) => { e.target.src = "/placeholder-vegetable.png"; }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>
            </div>
          </div>

          {/* Savings */}
          {calculations.savings && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Savings</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{calculations.savings.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-yellow-600">{calculations.savings.percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ratio</p>
                  <p className="text-2xl font-bold text-yellow-600">{calculations.savings.ratio}x</p>
                </div>
              </div>
            </div>
          )}

          {/* VegBazar Prices */}
          {calculations.vegBazarPrices && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">📊 VegBazar Prices</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {Object.entries(calculations.vegBazarPrices).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-600">{key.replace('weight', '')}</p>
                    <p className="text-lg font-bold text-blue-600">₹{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Prices */}
          {calculations.marketPrices && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">🏪 Market Prices</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {Object.entries(calculations.marketPrices).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-600">{key.replace('weight', '')}</p>
                    <p className="text-lg font-bold text-green-600">₹{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VegetableUpdateModal;