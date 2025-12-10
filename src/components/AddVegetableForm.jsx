import axios from "axios";
import React, { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const ROUND2 = (n) => Number(Number(n || 0).toFixed(2));

const calculatePrices = (price1kg) => {
  if (price1kg === "" || price1kg === null || isNaN(price1kg)) return null;
  const p = parseFloat(price1kg);
  return {
    weight1kg: ROUND2(p),
    weight500g: Math.round((p / 2) * 100) / 100,
    weight250g: Math.round((p / 4) * 100) / 100,
    weight100g: Math.round((p / 10) * 100) / 100,
  };
};

const calculateSavings = (vegBazar, market) => {
  const v = parseFloat(vegBazar);
  const m = parseFloat(market);
  if (!v || !m || isNaN(v) || isNaN(m)) return { amount: 0, percentage: 0 };
  const amount = ROUND2(m - v);
  const percentage = Number(((amount / m) * 100).toFixed(1));
  return { amount, percentage };
};

const AddVegetableForm = () => {
  const [mode, setMode] = useState("weight");

  // Weight mode form
  const [formData, setFormData] = useState({
    vegetableName: "",
    stock: "",
    image: "",
    offer: "",
    price1kg: "",
    marketPrice1kg: "",
    description: "",
    screen: "1",
  });

  // Set mode form
  const [setsForm, setSetsForm] = useState({
    name: "",
    stockPieces: "",
    image: "",
    offer: "",
    description: "",
    screen: "1",
    sets: [
      { quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (mode === "weight") {
      if (!formData.vegetableName.trim())
        newErrors.vegetableName = "Vegetable name is required";
      if (!formData.stock || parseFloat(formData.stock) < 0)
        newErrors.stock = "Stock must be 0 or greater";
      if (
        !formData.price1kg ||
        parseFloat(formData.price1kg) <= 0
      )
        newErrors.price1kg = "VegBazar price must be greater than 0";
      if (!formData.marketPrice1kg || parseFloat(formData.marketPrice1kg) <= 0)
        newErrors.marketPrice1kg = "Market price must be greater than 0";

      if (!formData.image.trim()) {
        newErrors.image = "Image URL is required";
      } else {
        try {
          new URL(formData.image);
        } catch {
          newErrors.image = "Please enter a valid URL";
        }
      }
    } else {
      if (!setsForm.name || !setsForm.name.trim())
        newErrors.name = "Name is required";
      if (setsForm.stockPieces === "" || isNaN(Number(setsForm.stockPieces)))
        newErrors.stockPieces = "Stock pieces is required";
      if (Number(setsForm.stockPieces) < 0)
        newErrors.stockPieces = "Stock cannot be negative";

      if (!Array.isArray(setsForm.sets) || setsForm.sets.length === 0)
        newErrors.sets = "At least one set is required";

      setsForm.sets.forEach((s, i) => {
        if (!s.quantity || Number(s.quantity) <= 0)
          newErrors[`sets.${i}.quantity`] = `Set ${i + 1}: quantity required`;
        if (!s.price || Number(s.price) <= 0)
          newErrors[`sets.${i}.price`] = `Set ${i + 1}: price required`;
      });

      if (!setsForm.image?.trim()) {
        newErrors.image = "Image URL is required";
      } else {
        try {
          new URL(setsForm.image);
        } catch {
          newErrors.image = "Please enter a valid URL";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addSetItem = () => {
    setSetsForm((prev) => ({
      ...prev,
      sets: [
        ...prev.sets,
        { quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" },
      ],
    }));
  };

  const removeSetItem = (index) => {
    setSetsForm((prev) => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  };

  const updateSetItem = (index, field, value) => {
    setSetsForm((prev) => ({
      ...prev,
      sets: prev.sets.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const resetForm = () => {
    setFormData({
      vegetableName: "",
      stock: "",
      image: "",
      screen: "1",
      offer: "",
      price1kg: "",
      marketPrice1kg: "",
      description: "",
    });
    setSetsForm({
      name: "",
      stockPieces: "",
      image: "",
      offer: "",
      description: "",
      screen: "1",
      sets: [
        { quantity: "", unit: "pieces", price: "", marketPrice: "", label: "" },
      ],
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSetInputChange = (field, value) => {
    setSetsForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let payload = {};

      if (mode === "weight") {
        // WEIGHT-BASED PAYLOAD - matches backend expectations
        payload = {
          name: formData.vegetableName.trim(),
          image: formData.image.trim(),
          stockKg: parseFloat(formData.stock),
          description: formData.description?.trim() || "",
          offer: formData.offer?.trim() || "",
          screenNumber: parseInt(formData.screen, 10) || 1,
          // These are the critical fields the backend expects
          price1kg: parseFloat(formData.price1kg),
          marketPrice1kg: parseFloat(formData.marketPrice1kg),
          // Explicitly disable set pricing
          setPricingEnabled: false,
        };
      } else {
        // SET-BASED PAYLOAD - matches backend expectations
        payload = {
          name: setsForm.name.trim(),
          image: setsForm.image.trim(),
          stockPieces: Number(setsForm.stockPieces),
          description: setsForm.description?.trim() || "",
          offer: setsForm.offer?.trim() || "",
          screenNumber: parseInt(setsForm.screen, 10) || 1,
          // Enable set pricing
          setPricingEnabled: true,
          sets: (setsForm.sets || []).map((s) => ({
            quantity: Number(s.quantity),
            unit: s.unit || "pieces",
            price: ROUND2(Number(s.price)),
            marketPrice: s.marketPrice
              ? ROUND2(Number(s.marketPrice))
              : undefined,
            label: s.label?.trim() || undefined,
          })),
        };
      }

      console.log("Sending payload:", payload); // Debug log

      const API_URL =
        import.meta.env.VITE_API_SERVER_URL || "http://localhost:5000";
      const token = localStorage.getItem("token"); // Adjust based on your auth setup

      await axios.post(`${API_URL}/api/vegetables/add`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      alert("Vegetable added successfully!");
      resetForm();
    } catch (err) {
      console.error("Error adding vegetable:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to add vegetable";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const vegBazarPrices = calculatePrices(formData.price1kg);
  const marketPrices_display = calculatePrices(formData.marketPrice1kg);
  const savings = calculateSavings(
    formData.price1kg,
    formData.marketPrice1kg
  );

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4 sm:py-6 flex flex-col justify-center">
      <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl mx-auto">
        <div className="relative px-4 py-6 sm:px-6 sm:py-10 bg-white shadow-lg rounded-lg sm:rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
                Add New Vegetable
              </h2>
              <p className="text-sm text-gray-500">
                Fill details to add a new vegetable
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("weight")}
                className={`px-3 py-2 rounded-md font-medium transition ${
                  mode === "weight"
                    ? "bg-[#0e540b] text-white"
                    : "bg-white text-black border border-gray-300"
                }`}
              >
                ⚖️ Weight
              </button>
              <button
                type="button"
                onClick={() => setMode("set")}
                className={`px-3 py-2 rounded-md font-medium transition ${
                  mode === "set"
                    ? "bg-[#0e540b] text-white"
                    : "bg-white text-black border border-gray-300"
                }`}
              >
                📦 Set / Pieces
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "weight" ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vegetable Name *
                  </label>
                  <input
                    type="text"
                    value={formData.vegetableName}
                    onChange={(e) =>
                      handleInputChange("vegetableName", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.vegetableName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    placeholder="e.g., Tomato"
                    disabled={isLoading}
                  />
                  {errors.vegetableName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.vegetableName}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.stock
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    placeholder="Enter stock"
                    disabled={isLoading}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                  )}
                </div>

                {/* Price row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VegBazar Price (1kg) ₹ *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price1kg}
                      onChange={(e) =>
                        handleInputChange("price1kg", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter VegBazar price"
                      disabled={isLoading}
                    />
                    {errors.price1kg && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.price1kg}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Market Price (1kg) ₹ *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.marketPrice1kg}
                      onChange={(e) =>
                        handleInputChange("marketPrice1kg", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter Market price"
                      disabled={isLoading}
                    />
                    {errors.marketPrice1kg && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.marketPrice1kg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange("image", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.image
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                  />
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>

                {/* Offer, screen, description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category/Screen
                    </label>
                    <select
                      value={formData.screen}
                      onChange={(e) =>
                        handleInputChange("screen", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="1">Category 1 - Fresh Vegetables</option>
                      <option value="2">Category 2 - Leafy Greens</option>
                      <option value="3">Category 3 - Root Vegetables</option>
                      <option value="4">Category 4 - Exotic Vegetables</option>
                      <option value="5">
                        Category 5 - Seasonal Vegetables
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Offer
                    </label>
                    <input
                      type="text"
                      value={formData.offer}
                      onChange={(e) =>
                        handleInputChange("offer", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 10% off"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Enter description (optional)"
                    disabled={isLoading}
                  />
                </div>

                {/* Previews */}
                {formData.price1kg && formData.marketPrice1kg && (
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Savings Amount
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ₹{savings.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Savings %</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {savings.percentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Multiplier</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {(
                            parseFloat(formData.marketPrice1kg) /
                            parseFloat(formData.price1kg)
                          ).toFixed(2)}
                          x
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {vegBazarPrices && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      VegBazar Prices (Auto)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
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

                {marketPrices_display && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      Market Prices (Auto)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
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
              </div>
            ) : (
              // Set mode UI
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={setsForm.name}
                    onChange={(e) =>
                      handleSetInputChange("name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.name
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    placeholder="e.g., Bhaji Bundle"
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock (pieces) *
                  </label>
                  <input
                    type="number"
                    value={setsForm.stockPieces}
                    onChange={(e) =>
                      handleSetInputChange("stockPieces", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.stockPieces
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    placeholder="Total pieces available"
                    disabled={isLoading}
                  />
                  {errors.stockPieces && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.stockPieces}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      value={setsForm.image}
                      onChange={(e) =>
                        handleSetInputChange("image", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.image
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-green-500"
                      }`}
                      placeholder="https://example.com/image.jpg"
                      disabled={isLoading}
                    />
                    {errors.image && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.image}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category/Screen
                    </label>
                    <select
                      value={setsForm.screen}
                      onChange={(e) =>
                        handleSetInputChange("screen", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isLoading}
                    >
                      <option value="1">Category 1 - Fresh Vegetables</option>
                      <option value="2">Category 2 - Leafy Greens</option>
                      <option value="3">Category 3 - Root Vegetables</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer
                  </label>
                  <input
                    type="text"
                    value={setsForm.offer}
                    onChange={(e) =>
                      handleSetInputChange("offer", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Buy 6 get 1 free"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={setsForm.description}
                    onChange={(e) =>
                      handleSetInputChange("description", e.target.value)
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Optional description"
                    disabled={isLoading}
                  />
                </div>

                {/* Sets list */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-black">
                      📦 Set Options
                    </h3>
                    <button
                      type="button"
                      onClick={addSetItem}
                      className="px-3 py-1 bg-[#0e540b] text-white text-sm rounded-md"
                    >
                      + Add Set
                    </button>
                  </div>

                  <div className="space-y-4">
                    {setsForm.sets.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-lg border border-gray-300"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-black">
                            Set {idx + 1}
                          </h4>
                          {setsForm.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSetItem(idx)}
                              className="text-red-600 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={s.quantity}
                              onChange={(e) =>
                                updateSetItem(idx, "quantity", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                              placeholder="e.g., 6"
                            />
                            {errors[`sets.${idx}.quantity`] && (
                              <p className="text-xs text-red-600">
                                {errors[`sets.${idx}.quantity`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <select
                              value={s.unit}
                              onChange={(e) =>
                                updateSetItem(idx, "unit", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                            >
                              <option value="pieces">Pieces</option>
                              <option value="bundles">Bundles</option>
                              <option value="sets">Sets</option>
                              <option value="nos">Nos</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Price ₹ *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={s.price}
                              onChange={(e) =>
                                updateSetItem(idx, "price", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-[#0e540b]/40 bg-[#0e540b]/5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                              placeholder="e.g., 10"
                            />
                            {errors[`sets.${idx}.price`] && (
                              <p className="text-xs text-red-600">
                                {errors[`sets.${idx}.price`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Market Price ₹
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={s.marketPrice}
                              onChange={(e) =>
                                updateSetItem(
                                  idx,
                                  "marketPrice",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                              placeholder="Optional"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Label (optional)
                            </label>
                            <input
                              type="text"
                              value={s.label}
                              onChange={(e) =>
                                updateSetItem(idx, "label", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0e540b]"
                              placeholder="e.g., 6 Bhaji Bundle"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Auto-generated if left empty
                            </p>
                          </div>
                        </div>

                        {/* preview */}
                        {s.quantity && s.price && (
                          <div className="mt-3 p-2 bg-[#0e540b]/5 rounded border border-[#0e540b]/20">
                            <p className="text-sm font-medium text-[#0e540b]">
                              {s.label || `${s.quantity} ${s.unit}`} - ₹
                              {s.price}
                              {s.marketPrice && (
                                <span className="text-gray-600 ml-2">
                                  (Market: ₹{s.marketPrice}, Save: ₹
                                  {(
                                    Number(s.marketPrice) - Number(s.price)
                                  ).toFixed(2)}
                                  )
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

            {/* Actions */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                  className="w-full sm:w-1/2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-1/2 px-4 py-2 text-sm font-medium text-white bg-[#0e540b] rounded-md hover:brightness-90 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>+ Add Vegetable</>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Live preview (both modes) */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-3">
              Live Preview
            </h3>

            {mode === "weight" ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-start space-x-4">
                  {formData.image && !errors.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {formData.vegetableName || "Vegetable Name"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Stock: {formData.stock || "0"} kg
                    </p>
                    {formData.price1kg && (
                      <p className="text-sm text-blue-600 font-bold">
                        VegBazar: ₹{formData.price1kg}
                      </p>
                    )}
                    {formData.marketPrice1kg && (
                      <p className="text-sm text-green-600 font-bold">
                        Market: ₹{formData.marketPrice1kg}
                      </p>
                    )}
                    {formData.offer && (
                      <p className="text-sm text-blue-600 mt-1">
                        {formData.offer}
                      </p>
                    )}
                    {formData.description && (
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-start space-x-4">
                  {setsForm.image && !errors.image && (
                    <img
                      src={setsForm.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {setsForm.name || "Set Name"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Stock pieces: {setsForm.stockPieces || "0"}
                    </p>
                    {setsForm.offer && (
                      <p className="text-sm text-blue-600 mt-1">
                        {setsForm.offer}
                      </p>
                    )}
                    {setsForm.description && (
                      <p className="text-xs text-gray-500 mt-2">
                        {setsForm.description}
                      </p>
                    )}
                    <div className="mt-2 space-y-2">
                      {(setsForm.sets || []).map((s, i) => (
                        <div key={i} className="text-sm text-gray-700">
                          {s.label || `${s.quantity} ${s.unit}`} — ₹{s.price}{" "}
                          {s.marketPrice ? (
                            <span className="text-gray-500">
                              {" "}
                              (M ₹{s.marketPrice})
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVegetableForm;
