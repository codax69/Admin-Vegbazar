import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const ROUND2 = (n) => Number(Number(n || 0).toFixed(2));
const calcBlock = (p, factors) =>
  p > 0
    ? {
        weight1kg: ROUND2(p),
        weight500g: ROUND2(p * factors.w500),
        weight250g: ROUND2(p * factors.w250),
        weight100g: ROUND2(p * factors.w100),
      }
    : null;

const vegFactors = { w500: 0.58, w250: 0.36, w100: 0.16 };
const marketFactors = { w500: 0.6, w250: 0.4, w100: 0.2 };

const VegetableUpdateModal = ({ vegetable, isOpen, onClose, onUpdate }) => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    price1kg: "",
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
        price1kg: vegetable.prices?.weight1kg ?? vegetable.price1kg ?? "",
        marketPrice1kg:
          vegetable.marketPrices?.weight1kg ?? vegetable.marketPrice1kg ?? "",
        stockKg: vegetable.stockKg ?? "",
        description: vegetable.description || "",
        image: vegetable.image || "",
        offer: vegetable.offer || "",
        screenNumber: vegetable.screenNumber || "",
      });
    }
  }, [vegetable]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const vPrice = Number(formData.price1kg) || 0;
    const mPrice = Number(formData.marketPrice1kg) || 0;
    const stock = Number(formData.stockKg) || 0;

    const vegBazarPrices = calcBlock(vPrice, vegFactors);
    const marketPrices = calcBlock(mPrice, marketFactors);

    const savings =
      vPrice > 0 && mPrice > 0
        ? {
            amount: ROUND2(mPrice - vPrice),
            percentage: Number((((mPrice - vPrice) / mPrice) * 100).toFixed(1)),
            ratio: Number((mPrice / vPrice).toFixed(2)),
          }
        : null;

    return {
      vegBazarPrices,
      marketPrices,
      savings,
      isOutOfStock: stock < 0.25,
      isLowStock: stock >= 0.25 && stock < 5,
    };
  }, [formData.price1kg, formData.marketPrice1kg, formData.stockKg]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const markOutOfStock = useCallback(() => {
    setFormData((prev) => ({ ...prev, stockKg: "0" }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!formData.name || !formData.name.trim()) errors.push("Name is required");
    if (!formData.price1kg || Number(formData.price1kg) <= 0)
      errors.push("Valid VegBazar price is required");
    if (!formData.marketPrice1kg || Number(formData.marketPrice1kg) <= 0)
      errors.push("Valid Market price is required");
    if (formData.stockKg === "" || isNaN(Number(formData.stockKg)))
      errors.push("Stock is required");
    if (Number(formData.stockKg) < 0) errors.push("Stock cannot be negative");
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
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
        const vPrice = Number(formData.price1kg);
        const mPrice = Number(formData.marketPrice1kg);
        const stockValue = Number(formData.stockKg);

        const updateData = {
          name: formData.name.trim(),
          price1kg: ROUND2(vPrice),
          marketPrice1kg: ROUND2(mPrice),
          stockKg: stockValue,
          outOfStock: stockValue < 0.25,
          description: formData.description?.trim() || "",
          image: formData.image?.trim() || "",
          offer: formData.offer?.trim() || "",
          screenNumber: formData.screenNumber || "",
        };

        const response = await axios.patch(
          `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${vegetable._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const returned = response.data?.data ?? response.data ?? null;
        if (returned) onUpdate(returned);
        onClose();
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Failed to update vegetable"
        );
      } finally {
        setLoading(false);
        stopLoading();
      }
    },
    [
      formData,
      validateForm,
      vegetable,
      token,
      onUpdate,
      onClose,
      startLoading,
      stopLoading,
    ]
  );

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  if (!vegetable) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-black mb-2">Error</h3>
            <p className="text-gray-600 mb-6">No vegetable data available to update</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-[#0e540b] text-white rounded-md hover:brightness-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-black rounded-t-lg">
          <h2 className="text-2xl font-bold text-white">Update Vegetable</h2>
          <button onClick={handleClose} className="text-white hover:text-[#0e540b] text-2xl">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {calculations.isOutOfStock && (
            <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg flex items-center gap-2">
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
                <label className="block text-sm font-medium text-black mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  VegBazar Price (1kg) ₹ *
                </label>
                <input
                  type="number"
                  name="price1kg"
                  value={formData.price1kg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#0e540b]/40 bg-[#0e540b]/5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Other weights calculated automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Market Price (1kg) ₹ *</label>
                <input
                  type="number"
                  name="marketPrice1kg"
                  value={formData.marketPrice1kg}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#0e540b]/40 bg-[#0e540b]/5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Other weights calculated automatically</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-black">Stock (kg) *</label>
                  <button
                    type="button"
                    onClick={markOutOfStock}
                    className="text-xs px-3 py-1 bg-[#0e540b]/10 text-[#0e540b] rounded-md hover:bg-[#0e540b]/20 transition font-medium"
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
                    calculations.isOutOfStock ? "border-red-300 bg-red-50 focus:ring-red-500" : "border-gray-300 focus:ring-[#0e540b]"
                  }`}
                  required
                />
                {calculations.isOutOfStock && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Out of Stock</p>}
                {calculations.isLowStock && <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Low Stock - Only {formData.stockKg}kg</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Offer</label>
                <input
                  type="text"
                  name="offer"
                  value={formData.offer}
                  onChange={handleInputChange}
                  placeholder="e.g., 10% off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Screen Number</label>
                <input
                  type="text"
                  name="screenNumber"
                  value={formData.screenNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1-5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                />
              </div>

              {formData.image && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Preview</label>
                  <div className="border border-gray-300 rounded-md p-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md mx-auto"
                      onError={(e) => {
                        e.target.src = "/placeholder-vegetable.png";
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b] resize-vertical"
                />
              </div>
            </div>
          </div>

          {/* Savings */}
          {calculations.savings && (
            <div className="mb-6 p-4 bg-[#0e540b]/10 rounded-lg border border-[#0e540b]/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-black mb-1">Savings</p>
                  <p className="text-2xl font-bold text-[#0e540b]">₹{calculations.savings.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-black mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-[#0e540b]">{calculations.savings.percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-black mb-1">Ratio</p>
                  <p className="text-2xl font-bold text-[#0e540b]">{calculations.savings.ratio}x</p>
                </div>
              </div>
            </div>
          )}

          {/* VegBazar Prices */}
          {calculations.vegBazarPrices && (
            <div className="mb-6 p-4 bg-[#0e540b]/5 rounded-lg border border-[#0e540b]/20">
              <h3 className="text-sm font-semibold text-[#0e540b] mb-3">📊 VegBazar Prices</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {Object.entries(calculations.vegBazarPrices).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-600">{key.replace("weight", "")}</p>
                    <p className="text-lg font-bold text-[#0e540b]">₹{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Prices */}
          {calculations.marketPrices && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-3">🏪 Market Prices</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {Object.entries(calculations.marketPrices).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-600">{key.replace("weight", "")}</p>
                    <p className="text-lg font-bold text-black">₹{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={handleClose} className="px-6 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0e540b] text-white rounded-md hover:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VegetableUpdateModal;
