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

  // Pricing type toggle
  const [pricingType, setPricingType] = useState("weight"); // 'weight' or 'set'

  // Weight-based form data
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

  // Set-based form data (renamed to avoid confusion)
  const [setsForm, setSetsForm] = useState({
    name: "",
    stockPieces: "",
    description: "",
    image: "",
    offer: "",
    screenNumber: "",
    sets: [{ quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" }],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when vegetable changes
  useEffect(() => {
    if (!vegetable) return;

    const isSetPricing = vegetable.setPricing?.enabled === true;
    setPricingType(isSetPricing ? "set" : "weight");

    if (isSetPricing) {
      setSetsForm({
        name: vegetable.name || "",
        stockPieces: vegetable.stockPieces ?? "",
        description: vegetable.description || "",
        image: vegetable.image || "",
        offer: vegetable.offer || "",
        screenNumber: vegetable.screenNumber || "",
        sets:
          vegetable.setPricing?.sets?.length > 0
            ? vegetable.setPricing.sets.map((s) => ({
                quantity: s.quantity ?? "",
                unit: s.unit ?? "pieces",
                price: s.price ?? "",
                marketPrice: s.marketPrice ?? "",
                label: s.label ?? "",
              }))
            : [{ quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" }],
      });
    } else {
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

  // Memoized calculations for weight-based pricing
  const calculations = useMemo(() => {
    if (pricingType === "set") return null;

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
  }, [formData.price1kg, formData.marketPrice1kg, formData.stockKg, pricingType]);

  // Calculations for set-based pricing
  const setCalculations = useMemo(() => {
    if (pricingType === "weight") return null;

    const stock = Number(setsForm.stockPieces) || 0;

    return {
      isOutOfStock: stock === 0,
      isLowStock: stock > 0 && stock < 10,
    };
  }, [setsForm.stockPieces, pricingType]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSetInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSetsForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSetItemChange = useCallback((index, field, value) => {
    setSetsForm((prev) => ({
      ...prev,
      sets: prev.sets.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }, []);

  const addSetItem = useCallback(() => {
    setSetsForm((prev) => ({
      ...prev,
      sets: [...prev.sets, { quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" }],
    }));
  }, []);

  const removeSetItem = useCallback((index) => {
    setSetsForm((prev) => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  }, []);

  const markOutOfStock = useCallback(() => {
    if (pricingType === "weight") {
      setFormData((prev) => ({ ...prev, stockKg: "0" }));
    } else {
      setSetsForm((prev) => ({ ...prev, stockPieces: "0" }));
    }
  }, [pricingType]);

  const validateForm = useCallback(() => {
    const errors = [];

    if (pricingType === "weight") {
      if (!formData.name || !formData.name.trim()) errors.push("Name is required");
      if (!formData.price1kg || Number(formData.price1kg) <= 0)
        errors.push("Valid VegBazar price is required");
      if (!formData.marketPrice1kg || Number(formData.marketPrice1kg) <= 0)
        errors.push("Valid Market price is required");
      if (formData.stockKg === "" || isNaN(Number(formData.stockKg)))
        errors.push("Stock is required");
      if (Number(formData.stockKg) < 0) errors.push("Stock cannot be negative");
    } else {
      if (!setsForm.name || !setsForm.name.trim()) errors.push("Name is required");
      if (setsForm.stockPieces === "" || isNaN(Number(setsForm.stockPieces)))
        errors.push("Stock pieces is required");
      if (Number(setsForm.stockPieces) < 0) errors.push("Stock cannot be negative");
      if (!Array.isArray(setsForm.sets) || setsForm.sets.length === 0)
        errors.push("At least one set is required");

      (setsForm.sets || []).forEach((s, index) => {
        if (!s.quantity || Number(s.quantity) <= 0)
          errors.push(`Set ${index + 1}: Quantity is required`);
        if (!s.price || Number(s.price) <= 0)
          errors.push(`Set ${index + 1}: Price is required`);
      });
    }

    return errors;
  }, [formData, setsForm, pricingType]);

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
        let updateData = {};

        if (pricingType === "weight") {
          const vPrice = Number(formData.price1kg);
          const mPrice = Number(formData.marketPrice1kg);
          const stockValue = Number(formData.stockKg);

          updateData = {
            name: formData.name.trim(),
            price1kg: ROUND2(vPrice),
            marketPrice1kg: ROUND2(mPrice),
            stockKg: stockValue,
            outOfStock: stockValue < 0.25,
            description: formData.description?.trim() || "",
            image: formData.image?.trim() || "",
            offer: formData.offer?.trim() || "",
            screenNumber: formData.screenNumber || "",
            setPricingEnabled: false,
          };
        } else {
          const stockValue = Number(setsForm.stockPieces);

          updateData = {
            name: setsForm.name.trim(),
            stockPieces: stockValue,
            outOfStock: stockValue === 0,
            description: setsForm.description?.trim() || "",
            image: setsForm.image?.trim() || "",
            offer: setsForm.offer?.trim() || "",
            screenNumber: setsForm.screenNumber || "",
            setPricingEnabled: true,
            sets: (setsForm.sets || []).map((s) => ({
              quantity: Number(s.quantity),
              unit: s.unit || "pieces",
              price: Number(s.price),
              marketPrice: s.marketPrice ? Number(s.marketPrice) : undefined,
              label: s.label?.trim() || `${s.quantity} ${s.unit}`,
            })),
          };
        }

        const response = await axios.patch(
          `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${vegetable._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const returned = response.data?.data ?? response.data ?? null;
        if (returned) onUpdate(returned);
        onClose();
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to update vegetable");
      } finally {
        setLoading(false);
        stopLoading();
      }
    },
    [
      formData,
      setsForm,
      pricingType,
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

  const currentCalculations = pricingType === "weight" ? calculations : setCalculations;

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
            <div className="mb-4 p-4 bg-red-50 border border-red-400 text-red-700 rounded">{error}</div>
          )}

          {/* Pricing Type Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-black mb-3">Pricing Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPricingType("weight")}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  pricingType === "weight"
                    ? "bg-[#0e540b] text-white"
                    : "bg-white text-black border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ⚖️ Weight-Based (kg)
              </button>
              <button
                type="button"
                onClick={() => setPricingType("set")}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  pricingType === "set"
                    ? "bg-[#0e540b] text-white"
                    : "bg-white text-black border border-gray-300 hover:bg-gray-50"
                }`}
              >
                📦 Set-Based (pieces/bundles)
              </button>
            </div>
          </div>

          {currentCalculations?.isOutOfStock && (
            <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-orange-800">Out of Stock</p>
                <p className="text-sm text-orange-700">Not available for purchase</p>
              </div>
            </div>
          )}

          {/* Weight-Based Form */}
          {pricingType === "weight" && (
            <>
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
                        calculations?.isOutOfStock ? "border-red-300 bg-red-50 focus:ring-red-500" : "border-gray-300 focus:ring-[#0e540b]"
                      }`}
                      required
                    />
                    {calculations?.isOutOfStock && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Out of Stock</p>}
                    {calculations?.isLowStock && <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Low Stock - Only {formData.stockKg}kg</p>}
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
              {calculations?.savings && (
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
              {calculations?.vegBazarPrices && (
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
              {calculations?.marketPrices && (
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
            </>
          )}

          {/* Set-Based Form */}
          {pricingType === "set" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={setsForm.name}
                      onChange={handleSetInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-black">Stock (Pieces) *</label>
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
                      name="stockPieces"
                      value={setsForm.stockPieces}
                      onChange={handleSetInputChange}
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        setCalculations?.isOutOfStock ? "border-red-300 bg-red-50 focus:ring-red-500" : "border-gray-300 focus:ring-[#0e540b]"
                      }`}
                      required
                    />
                    {setCalculations?.isOutOfStock && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Out of Stock</p>}
                    {setCalculations?.isLowStock && <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Low Stock - Only {setsForm.stockPieces} pieces</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Offer</label>
                    <input
                      type="text"
                      name="offer"
                      value={setsForm.offer}
                      onChange={handleSetInputChange}
                      placeholder="e.g., Buy 6 get 1 free"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Screen Number</label>
                    <input
                      type="text"
                      name="screenNumber"
                      value={setsForm.screenNumber}
                      onChange={handleSetInputChange}
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
                      value={setsForm.image}
                      onChange={handleSetInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                    />
                  </div>

                  {setsForm.image && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Preview</label>
                      <div className="border border-gray-300 rounded-md p-2">
                        <img
                          src={setsForm.image}
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
                      value={setsForm.description}
                      onChange={handleSetInputChange}
                      rows="4"
                      placeholder="Brief description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e540b] resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Set Items */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-black">📦 Set Pricing Options</h3>
                  <button
                    type="button"
                    onClick={addSetItem}
                    className="px-3 py-1 bg-[#0e540b] text-white text-sm rounded-md hover:brightness-90 transition"
                  >
                    + Add Set
                  </button>
                </div>

                <div className="space-y-4">
                  {setsForm.sets.map((s, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-gray-300">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-black">Set {index + 1}</h4>
                        {setsForm.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSetItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={s.quantity}
                            onChange={(e) => handleSetItemChange(index, "quantity", e.target.value)}
                            min="1"
                            step="1"
                            placeholder="e.g., 6"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                          <select
                            value={s.unit}
                            onChange={(e) => handleSetItemChange(index, "unit", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                          >
                            <option value="pieces">Pieces</option>
                            <option value="bundles">Bundles</option>
                            <option value="sets">Sets</option>
                            <option value="nos">Nos</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price ₹ *</label>
                          <input
                            type="number"
                            value={s.price}
                            onChange={(e) => handleSetItemChange(index, "price", e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="e.g., 10"
                            className="w-full px-3 py-2 border border-[#0e540b]/40 bg-[#0e540b]/5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Market Price ₹</label>
                          <input
                            type="number"
                            value={s.marketPrice}
                            onChange={(e) => handleSetItemChange(index, "marketPrice", e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="e.g., 15"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Label (Optional)</label>
                          <input
                            type="text"
                            value={s.label}
                            onChange={(e) => handleSetItemChange(index, "label", e.target.value)}
                            placeholder="e.g., 6 Bhaji Bundle"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Auto-generated if empty</p>
                        </div>
                      </div>

                      {/* Set Preview */}
                      {s.quantity && s.price && (
                        <div className="mt-3 p-2 bg-[#0e540b]/5 rounded border border-[#0e540b]/20">
                          <p className="text-sm font-medium text-[#0e540b]">
                            {s.label || `${s.quantity} ${s.unit}`} - ₹{s.price}
                            {s.marketPrice && (
                              <span className="text-gray-600 ml-2">
                                (Market: ₹{s.marketPrice}, Save: ₹{(Number(s.marketPrice) - Number(s.price)).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0e540b] text-white rounded-md hover:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
