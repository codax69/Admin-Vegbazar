import React, { useState, useEffect } from "react";
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
  const [imagePreview, setImagePreview] = useState("");

  // Helper function to calculate prices from 1kg price (for preview only)
  const calculatePrices = (price1kg) => {
    if (!price1kg || isNaN(price1kg)) return null;
    const p = parseFloat(price1kg);
    return {
      weight1kg: Math.round(p * 100) / 100,
      weight500g: Math.round((p / 2) * 100) / 100,
      weight250g: Math.round((p / 4) * 100) / 100,
      weight100g: Math.round((p / 10) * 100) / 100,
    };
  };

  // Calculate savings
  const calculateSavings = (vegBazar, market) => {
    if (!vegBazar || !market) return { amount: 0, percentage: 0 };
    const amount = (market - vegBazar).toFixed(2);
    const percentage = ((amount / market) * 100).toFixed(1);
    return { amount, percentage };
  };

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
      setImagePreview(vegetable.image || "");
    }
  }, [vegetable]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "image") {
      setImagePreview(value);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.vegBazarPrice1kg || parseFloat(formData.vegBazarPrice1kg) <= 0)
      errors.push("Valid VegBazar price is required");
    if (!formData.marketPrice1kg || parseFloat(formData.marketPrice1kg) <= 0)
      errors.push("Valid Market price is required");
    if (!formData.stockKg || parseFloat(formData.stockKg) <= 0)
      errors.push("Valid stock is required");

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }
    startLoading();
    setLoading(true);
    setError(null);

    try {
      // Send only the 1kg prices - backend will calculate all variants
      const updateData = {
        name: formData.name.trim(),
        price1kg: parseFloat(formData.vegBazarPrice1kg),
        marketPrice1kg: parseFloat(formData.marketPrice1kg),
        stockKg: parseFloat(formData.stockKg),
        description: formData.description.trim(),
        image: formData.image.trim(),
        offer: formData.offer.trim(),
        screenNumber: formData.screenNumber,
      };

      console.log("Sending update data:", updateData);

      const response = await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${vegetable._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update vegetable"
      );
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Calculate prices for preview
  const vegBazarPrices = calculatePrices(formData.vegBazarPrice1kg);
  const marketPrices_display = calculatePrices(formData.marketPrice1kg);
  const savings = calculateSavings(
    formData.vegBazarPrice1kg,
    formData.marketPrice1kg
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Update Vegetable Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* VegBazar Price (1kg) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VegBazar Price (1kg) ₹ *
                </label>
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
                <p className="text-xs text-gray-500 mt-1">
                  All other weights will be calculated automatically
                </p>
              </div>

              {/* Market Price (1kg) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Price (1kg) ₹ *
                </label>
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
                <p className="text-xs text-gray-500 mt-1">
                  All other weights will be calculated automatically
                </p>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock (kg) *
                </label>
                <input
                  type="number"
                  name="stockKg"
                  value={formData.stockKg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Offer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer
                </label>
                <input
                  type="text"
                  name="offer"
                  value={formData.offer}
                  onChange={handleInputChange}
                  placeholder="e.g., 10% off, Buy 2 Get 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Screen Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screen Number
                </label>
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
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <div className="border border-gray-300 rounded-md p-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md mx-auto"
                      onError={(e) => {
                        e.target.src = "/placeholder-vegetable.png";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Brief description of the vegetable..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>
            </div>
          </div>

          {/* Savings Summary */}
          {formData.vegBazarPrice1kg && formData.marketPrice1kg && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Savings Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₹{savings.amount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Savings Percentage</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {savings.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Price Ratio</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {(formData.marketPrice1kg / formData.vegBazarPrice1kg).toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VegBazar Prices Preview */}
          {vegBazarPrices && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                📊 VegBazar Prices Preview (Auto-calculated)
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-600">1 kg</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{vegBazarPrices.weight1kg}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">500g</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{vegBazarPrices.weight500g}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">250g</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{vegBazarPrices.weight250g}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">100g</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{vegBazarPrices.weight100g}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Prices Preview */}
          {marketPrices_display && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">
                🏪 Market Prices Preview (Auto-calculated)
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-600">1 kg</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{marketPrices_display.weight1kg}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">500g</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{marketPrices_display.weight500g}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">250g</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{marketPrices_display.weight250g}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">100g</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{marketPrices_display.weight100g}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
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