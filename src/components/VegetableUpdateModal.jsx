import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const VegetableUpdateModal = ({ vegetable, isOpen, onClose, onUpdate }) => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    // VegBazar Prices
    vegBazarPrice1kg: "",
    vegBazarPrice500g: "",
    vegBazarPrice250g: "",
    vegBazarPrice100g: "",
    // Market Prices
    marketPrice1kg: "",
    marketPrice500g: "",
    marketPrice250g: "",
    marketPrice100g: "",
    // Other fields
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
        // VegBazar Prices
        vegBazarPrice1kg: vegetable.prices?.weight1kg || "",
        vegBazarPrice500g: vegetable.prices?.weight500g || "",
        vegBazarPrice250g: vegetable.prices?.weight250g || "",
        vegBazarPrice100g: vegetable.prices?.weight100g || "",
        // Market Prices
        marketPrice1kg: vegetable.marketPrices?.weight1kg || "",
        marketPrice500g: vegetable.marketPrices?.weight500g || "",
        marketPrice250g: vegetable.marketPrices?.weight250g || "",
        marketPrice100g: vegetable.marketPrices?.weight100g || "",
        // Other fields
        stockKg: vegetable.stockKg || "",
        description: vegetable.description || "",
        image: vegetable.image || "",
        offer: vegetable.offer || "",
        screenNumber: vegetable.screenNumber || "",
      });
    }
  }, [vegetable]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Auto-calculate prices based on 1kg price
  const autoCalculateVegBazarPrices = useCallback(() => {
    const price1kg = parseFloat(formData.vegBazarPrice1kg);
    if (price1kg > 0) {
      setFormData(prev => ({
        ...prev,
        vegBazarPrice500g: (price1kg * 0.58).toFixed(2), // 58% of 1kg price
        vegBazarPrice250g: (price1kg * 0.36).toFixed(2), // 36% of 1kg price
        vegBazarPrice100g: (price1kg * 0.16).toFixed(2), // 16% of 1kg price
      }));
    }
  }, [formData.vegBazarPrice1kg]);

  const autoCalculateMarketPrices = useCallback(() => {
    const price1kg = parseFloat(formData.marketPrice1kg);
    if (price1kg > 0) {
      setFormData(prev => ({
        ...prev,
        marketPrice500g: (price1kg * 0.60).toFixed(2), // 58% of 1kg price
        marketPrice250g: (price1kg * 0.40).toFixed(2), // 36% of 1kg price
        marketPrice100g: (price1kg * 0.20).toFixed(2), // 16% of 1kg price
      }));
    }
  }, [formData.marketPrice1kg]);

  const markOutOfStock = useCallback(() => {
    setFormData(prev => ({ ...prev, stockKg: "0" }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Name is required");
    
    // VegBazar prices validation
    if (!formData.vegBazarPrice1kg || parseFloat(formData.vegBazarPrice1kg) <= 0)
      errors.push("VegBazar 1kg price is required");
    if (!formData.vegBazarPrice500g || parseFloat(formData.vegBazarPrice500g) <= 0)
      errors.push("VegBazar 500g price is required");
    if (!formData.vegBazarPrice250g || parseFloat(formData.vegBazarPrice250g) <= 0)
      errors.push("VegBazar 250g price is required");
    if (!formData.vegBazarPrice100g || parseFloat(formData.vegBazarPrice100g) <= 0)
      errors.push("VegBazar 100g price is required");
    
    // Market prices validation
    if (!formData.marketPrice1kg || parseFloat(formData.marketPrice1kg) <= 0)
      errors.push("Market 1kg price is required");
    if (!formData.marketPrice500g || parseFloat(formData.marketPrice500g) <= 0)
      errors.push("Market 500g price is required");
    if (!formData.marketPrice250g || parseFloat(formData.marketPrice250g) <= 0)
      errors.push("Market 250g price is required");
    if (!formData.marketPrice100g || parseFloat(formData.marketPrice100g) <= 0)
      errors.push("Market 100g price is required");
    
    if (formData.stockKg === "" || parseFloat(formData.stockKg) < 0)
      errors.push("Stock cannot be negative");
    
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

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
        // Send individual prices for all weights
        vegBazarPrices: {
          weight1kg: parseFloat(formData.vegBazarPrice1kg),
          weight500g: parseFloat(formData.vegBazarPrice500g),
          weight250g: parseFloat(formData.vegBazarPrice250g),
          weight100g: parseFloat(formData.vegBazarPrice100g),
        },
        marketPrices: {
          weight1kg: parseFloat(formData.marketPrice1kg),
          weight500g: parseFloat(formData.marketPrice500g),
          weight250g: parseFloat(formData.marketPrice250g),
          weight100g: parseFloat(formData.marketPrice100g),
        },
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

  const isOutOfStock = parseFloat(formData.stockKg) <= 0;
  const isLowStock = parseFloat(formData.stockKg) > 0 && parseFloat(formData.stockKg) < 5;

  // Calculate savings
  const calculateSavings = () => {
    const vPrice = parseFloat(formData.vegBazarPrice1kg);
    const mPrice = parseFloat(formData.marketPrice1kg);
    
    if (vPrice > 0 && mPrice > 0) {
      return {
        amount: (mPrice - vPrice).toFixed(2),
        percentage: (((mPrice - vPrice) / mPrice) * 100).toFixed(1),
      };
    }
    return null;
  };

  const savings = calculateSavings();

  if (!isOpen) return null;

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

          {isOutOfStock && (
            <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-lg flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-orange-800">Out of Stock</p>
                <p className="text-sm text-orange-700">Not available for purchase</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Basic Info */}
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
                    isOutOfStock 
                      ? "border-red-300 bg-red-50 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  required
                />
                {isOutOfStock && (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Out of Stock</p>
                )}
                {isLowStock && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Low Stock - Only {formData.stockKg}kg</p>
                )}
              </div>

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
                  rows="3"
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
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

            {/* Right Column - Prices */}
            <div className="space-y-6">
              {/* VegBazar Prices */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-blue-900">📊 VegBazar Prices *</h3>
                  <button
                    type="button"
                    onClick={autoCalculateVegBazarPrices}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                    title="Auto-calculate from 1kg price"
                  >
                    ✨ Auto Calculate
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">1 KG (₹)</label>
                    <input
                      type="number"
                      name="vegBazarPrice1kg"
                      value={formData.vegBazarPrice1kg}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-blue-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">500g (₹) - ~58% of 1kg</label>
                    <input
                      type="number"
                      name="vegBazarPrice500g"
                      value={formData.vegBazarPrice500g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-blue-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 29"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">250g (₹) - ~36% of 1kg</label>
                    <input
                      type="number"
                      name="vegBazarPrice250g"
                      value={formData.vegBazarPrice250g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-blue-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 18"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">100g (₹) - ~16% of 1kg</label>
                    <input
                      type="number"
                      name="vegBazarPrice100g"
                      value={formData.vegBazarPrice100g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-blue-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 8"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Market Prices */}
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-green-900">🏪 Market Prices *</h3>
                  <button
                    type="button"
                    onClick={autoCalculateMarketPrices}
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
                    title="Auto-calculate from 1kg price"
                  >
                    ✨ Auto Calculate
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">1 KG (₹)</label>
                    <input
                      type="number"
                      name="marketPrice1kg"
                      value={formData.marketPrice1kg}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-green-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 60"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">500g (₹) - ~58% of 1kg</label>
                    <input
                      type="number"
                      name="marketPrice500g"
                      value={formData.marketPrice500g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-green-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">250g (₹) - ~36% of 1kg</label>
                    <input
                      type="number"
                      name="marketPrice250g"
                      value={formData.marketPrice250g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-green-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">100g (₹) - ~16% of 1kg</label>
                    <input
                      type="number"
                      name="marketPrice100g"
                      value={formData.marketPrice100g}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-green-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Display */}
          {savings && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3">💰 Savings on 1kg</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Amount Saved</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{savings.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-yellow-600">{savings.percentage}%</p>
                </div>
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
              {loading ? "Updating..." : "Update Vegetable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VegetableUpdateModal;