import axios from "axios";
import React, { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import { Leaf, Layers, Scale, Package, Info, UploadCloud, DollarSign } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

          {/* Compact Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0e540b]/10 rounded-full flex items-center justify-center text-[#0e540b]">
                <Leaf size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                  Add New Item
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Create inventory for your catalog
                </p>
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
              <button
                type="button"
                onClick={() => setMode("weight")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${mode === "weight"
                  ? "bg-white text-[#0e540b] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <span className="flex items-center gap-1.5"><Scale size={12} /> By Weight</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("set")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${mode === "set"
                  ? "bg-white text-[#0e540b] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <span className="flex items-center gap-1.5"><Layers size={12} /> By Set</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {mode === "weight" ? (
              <div className="space-y-6">
                {/* Weight Mode Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Product Name</label>
                      <input
                        type="text"
                        value={formData.vegetableName}
                        onChange={(e) => handleInputChange("vegetableName", e.target.value)}
                        className={`w-full bg-gray-50 border px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.vegetableName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                        placeholder="e.g. Red Tomato"
                        disabled={isLoading}
                      />
                      {errors.vegetableName && <p className="mt-1 text-[10px] font-medium text-red-600 flex items-center gap-1"><span>!</span>{errors.vegetableName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Stock Details (KG)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => handleInputChange("stock", e.target.value)}
                          className={`w-full bg-gray-50 border px-3 py-2.5 pl-3 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.stock ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                          placeholder="0.00"
                          disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400 font-bold">KG</div>
                      </div>
                      {errors.stock && <p className="mt-1 text-[10px] font-medium text-red-600 flex items-center gap-1"><span>!</span>{errors.stock}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">VegBazar Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            value={formData.price1kg}
                            onChange={(e) => handleInputChange("price1kg", e.target.value)}
                            className={`w-full pl-7 pr-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.price1kg ? "border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                            placeholder="0"
                          />
                        </div>
                        {errors.price1kg && <p className="mt-1 text-[10px] font-medium text-red-600">{errors.price1kg}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Market Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            value={formData.marketPrice1kg}
                            onChange={(e) => handleInputChange("marketPrice1kg", e.target.value)}
                            className={`w-full pl-7 pr-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.marketPrice1kg ? "border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                            placeholder="0"
                          />
                        </div>
                        {errors.marketPrice1kg && <p className="mt-1 text-[10px] font-medium text-red-600">{errors.marketPrice1kg}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows="4"
                        className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] transition-all resize-none placeholder-gray-400"
                        placeholder="Describe the product..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Product Image</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => handleInputChange("image", e.target.value)}
                          className={`flex-1 bg-gray-50 border px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.image ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <div className="w-10 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                          <UploadCloud size={16} />
                        </div>
                      </div>
                      {errors.image && <p className="mt-1 text-[10px] font-medium text-red-600">{errors.image}</p>}

                      {formData.image && (
                        <div className="mt-3 h-32 w-full bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                          <img src={formData.image} alt="Preview" className="h-full w-full object-contain p-2" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Category</label>
                    <div className="relative">
                      <select
                        value={formData.screen}
                        onChange={(e) => handleInputChange("screen", e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] transition-all"
                      >
                        <option value="1">Fresh Vegetables</option>
                        <option value="2">Leafy Greens</option>
                        <option value="3">Root Vegetables</option>
                        <option value="4">Exotic Vegetables</option>
                        <option value="5">Seasonal Vegetables</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Active Offer</label>
                    <input
                      type="text"
                      value={formData.offer}
                      onChange={(e) => handleInputChange("offer", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] transition-all"
                      placeholder="e.g. 15% OFF"
                    />
                  </div>
                </div>

                {/* Price Preview */}
                {(vegBazarPrices || marketPrices_display) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Info size={12} /> Price Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vegBazarPrices && (
                        <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                          <h5 className="text-[#0e540b] font-bold uppercase text-[10px] mb-3 tracking-wider">VegBazar Pricing</h5>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {Object.entries(vegBazarPrices).map(([key, val]) => (
                              <div key={key} className="bg-green-50/50 p-2 rounded-md">
                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">{key.replace('weight', '')}</p>
                                <p className="text-sm font-black text-[#0e540b]">₹{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {savings?.amount > 0 && (
                        <div className="flex items-center justify-center p-2">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Savings</p>
                            <p className="text-3xl font-black text-[#0e540b] tracking-tight">
                              {savings.percentage}%
                            </p>
                            <p className="text-xs text-green-700 font-semibold mt-1 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                              Save ₹{savings.amount} /kg
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Set Mode Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Set Name</label>
                      <input
                        type="text"
                        value={setsForm.name}
                        onChange={(e) => handleSetInputChange("name", e.target.value)}
                        className={`w-full bg-gray-50 border px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.name ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                        placeholder="e.g. Family Pack"
                      />
                      {errors.name && <p className="mt-1 text-[10px] font-medium text-red-600 flex items-center gap-1"><span>!</span>{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Stock Limit (Pieces)</label>
                      <input
                        type="number"
                        value={setsForm.stockPieces}
                        onChange={(e) => handleSetInputChange("stockPieces", e.target.value)}
                        className={`w-full bg-gray-50 border px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.stockPieces ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                        placeholder="e.g. 50"
                      />
                      {errors.stockPieces && <p className="mt-1 text-[10px] font-medium text-red-600">{errors.stockPieces}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Description</label>
                      <textarea
                        value={setsForm.description}
                        onChange={(e) => handleSetInputChange("description", e.target.value)}
                        rows="4"
                        className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] transition-all resize-none placeholder-gray-400"
                        placeholder="Describe what's in the set..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sets Builder */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                      <Package size={16} className="text-[#0e540b]" /> Set Configurations
                    </h3>
                    <button
                      type="button"
                      onClick={addSetItem}
                      className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-md hover:bg-black transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-3">
                    {setsForm.sets.map((s, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-gray-300 hover:shadow-sm transition-all">
                        {setsForm.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSetItem(idx)}
                            className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center bg-white rounded-full text-red-500 shadow-sm border border-gray-100 hover:bg-red-50 transition-all"
                          >
                            &times;
                          </button>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quantity</label>
                            <input
                              type="number"
                              value={s.quantity}
                              onChange={(e) => updateSetItem(idx, "quantity", e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]/20"
                              placeholder="Qty"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit Type</label>
                            <select
                              value={s.unit}
                              onChange={(e) => updateSetItem(idx, "unit", e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]/20"
                            >
                              <option value="pieces">Pieces</option>
                              <option value="bundles">Bundles</option>
                              <option value="sets">Sets</option>
                              <option value="nos">Nos</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Our Price</label>
                            <input
                              type="number"
                              value={s.price}
                              onChange={(e) => updateSetItem(idx, "price", e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-[#0e540b] focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]/20"
                              placeholder="₹"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Market Price</label>
                            <input
                              type="number"
                              value={s.marketPrice}
                              onChange={(e) => updateSetItem(idx, "marketPrice", e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-gray-500 focus:outline-none focus:border-[#0e540b] focus:ring-1 focus:ring-[#0e540b]/20"
                              placeholder="₹"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Details for Sets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Set Image URL</label>
                    <input
                      type="url"
                      value={setsForm.image}
                      onChange={(e) => handleSetInputChange("image", e.target.value)}
                      className={`w-full bg-gray-50 border px-3 py-2.5 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 transition-all ${errors.image ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#0e540b]"}`}
                      placeholder="https://"
                    />
                    {errors.image && <p className="mt-1 text-[10px] font-medium text-red-600">{errors.image}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Category</label>
                    <div className="relative">
                      <select
                        value={setsForm.screen}
                        onChange={(e) => handleSetInputChange("screen", e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] transition-all"
                      >
                        <option value="1">Fresh Vegetables</option>
                        <option value="2">Leafy Greens</option>
                        <option value="3">Root Vegetables</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs uppercase tracking-wide transition-colors"
                disabled={isLoading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#0e540b] text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-[#0b4209] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none text-xs uppercase tracking-wide flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span>Add to Inventory</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVegetableForm;
