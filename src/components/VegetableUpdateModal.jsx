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
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white max-w-sm w-full p-8 text-center shadow-2xl border-t-4 border-[#d43900] rounded-3xl">
          <div className="text-[#d43900] text-4xl mb-4 font-light">!</div>
          <h3 className="text-xl font-bold text-black mb-2 uppercase tracking-tight">Data Error</h3>
          <p className="text-gray-500 mb-8 font-light text-sm">No vegetable data available to update.</p>
          <button
            onClick={handleClose}
            className="w-full py-3 bg-black text-white font-medium hover:bg-gray-800 transition uppercase tracking-widest text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentCalculations = pricingType === "weight" ? calculations : setCalculations;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col rounded-3xl border-2 border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-start p-8 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-bold text-black tracking-tight mb-1">Update Product</h2>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#0e540b]">
              <span>{vegetable.name}</span>
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
              <span className="text-gray-400">Inventory Management</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-all p-2 hover:bg-black rounded-full"
          >
            <span className="text-2xl leading-none block w-6 h-6 text-center">&times;</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-[#d43900]/5 border-l-4 border-[#d43900] text-[#d43900] text-sm font-medium rounded-r-xl">
              {error}
            </div>
          )}

          {/* Pricing Type Checkbox/Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Pricing Model</span>
            <div className="flex p-1 bg-white rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setPricingType("weight")}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${pricingType === "weight"
                  ? "bg-[#0e540b] text-white shadow-md"
                  : "text-gray-400 hover:text-black"
                  }`}
              >
                By Weight (KG)
              </button>
              <button
                type="button"
                onClick={() => setPricingType("set")}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${pricingType === "set"
                  ? "bg-[#0e540b] text-white shadow-md"
                  : "text-gray-400 hover:text-black"
                  }`}
              >
                By Set (Units)
              </button>
            </div>
          </div>

          {currentCalculations?.isOutOfStock && (
            <div className="flex items-center gap-3 p-4 bg-[#d43900]/5 border border-[#d43900]/20 text-[#d43900]">
              <span className="font-bold uppercase text-xs tracking-wider">Out of Stock</span>
              <span className="w-px h-4 bg-[#d43900]/20"></span>
              <span className="text-sm">Item is hidden from purchase availability.</span>
            </div>
          )}

          {/* WEIGHT BASED */}
          {pricingType === "weight" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Column 1 */}
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                    placeholder="Enter vegetable name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Our Price (1kg)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500">₹</span>
                      <input
                        type="number"
                        name="price1kg"
                        value={formData.price1kg}
                        onChange={handleInputChange}
                        className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] pl-8 pr-4 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Market Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500">₹</span>
                      <input
                        type="number"
                        name="marketPrice1kg"
                        value={formData.marketPrice1kg}
                        onChange={handleInputChange}
                        className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] pl-8 pr-4 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Stock Level (kg)</label>
                    <button type="button" onClick={markOutOfStock} className="text-[10px] font-bold text-[#d43900] uppercase tracking-wider hover:underline">
                      Set Out of Stock
                    </button>
                  </div>
                  <input
                    type="number"
                    name="stockKg"
                    value={formData.stockKg}
                    onChange={handleInputChange}
                    className={`w-full bg-white border-2 px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none ${calculations?.isOutOfStock
                      ? "border-[#d43900] text-[#d43900]"
                      : "border-gray-300 focus:border-[#0e540b]"
                      }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Special Offer</label>
                    <input
                      type="text"
                      name="offer"
                      value={formData.offer}
                      onChange={handleInputChange}
                      placeholder="e.g. 10% OFF"
                      className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Order</label>
                    <input
                      type="text"
                      name="screenNumber"
                      value={formData.screenNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 1"
                      className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none text-xs"
                  />
                </div>

                {formData.image && (
                  <div className="h-40 w-full bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-200 shadow-inner">
                    <img src={formData.image} alt="Preview" className="h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SET BASED */}
          {pricingType === "set" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={setsForm.name}
                      onChange={handleSetInputChange}
                      className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Total Stock (Pieces)</label>
                      <button type="button" onClick={markOutOfStock} className="text-[10px] font-bold text-[#d43900] uppercase tracking-wider hover:underline">
                        Set Out of Stock
                      </button>
                    </div>
                    <input
                      type="number"
                      name="stockPieces"
                      value={setsForm.stockPieces}
                      onChange={handleSetInputChange}
                      className={`w-full bg-white border-2 px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none ${setCalculations?.isOutOfStock ? "border-[#d43900] text-[#d43900]" : "border-gray-300 focus:border-[#0e540b]"
                        }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Offer</label>
                      <input
                        type="text"
                        name="offer"
                        value={setsForm.offer}
                        onChange={handleSetInputChange}
                        placeholder="e.g. Buy 1 Get 1"
                        className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Order</label>
                      <input
                        type="text"
                        name="screenNumber"
                        value={setsForm.screenNumber}
                        onChange={handleSetInputChange}
                        placeholder="e.g. 1"
                        className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      name="description"
                      value={setsForm.description}
                      onChange={handleSetInputChange}
                      rows="3"
                      className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Image URL</label>
                    <input
                      type="url"
                      name="image"
                      value={setsForm.image}
                      onChange={handleSetInputChange}
                      className="w-full bg-white border-2 border-gray-300 focus:border-[#0e540b] px-5 py-3.5 text-black font-medium transition-all rounded-xl focus:shadow-md focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Set Items Builder */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#0e540b]">Set Configurations</h4>
                  <button
                    type="button"
                    onClick={addSetItem}
                    className="text-xs bg-black text-white px-4 py-2 uppercase tracking-widest font-bold hover:bg-gray-800 transition"
                  >
                    + Add Variation
                  </button>
                </div>
                <div className="space-y-4">
                  {setsForm.sets.map((s, index) => (
                    <div key={index} className="bg-gray-50 p-6 border border-gray-200 relative group">
                      <button
                        type="button"
                        onClick={() => removeSetItem(index)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-[#d43900] transition-colors"
                        title="Remove Set"
                      >
                        &times;
                      </button>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qty</label>
                          <input
                            type="number"
                            value={s.quantity}
                            onChange={(e) => handleSetItemChange(index, "quantity", e.target.value)}
                            className="w-full bg-white border border-gray-200 p-2 text-sm focus:border-[#0e540b] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit</label>
                          <select
                            value={s.unit}
                            onChange={(e) => handleSetItemChange(index, "unit", e.target.value)}
                            className="w-full bg-white border border-gray-200 p-2 text-sm focus:border-[#0e540b] focus:outline-none"
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
                            onChange={(e) => handleSetItemChange(index, "price", e.target.value)}
                            className="w-full bg-white border border-gray-200 p-2 text-sm focus:border-[#0e540b] focus:outline-none font-bold text-[#0e540b]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Market Price</label>
                          <input
                            type="number"
                            value={s.marketPrice}
                            onChange={(e) => handleSetItemChange(index, "marketPrice", e.target.value)}
                            className="w-full bg-white border border-gray-200 p-2 text-sm focus:border-[#0e540b] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
            <button className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#d43900] transition-colors font-bold" type="button" onClick={handleClose}>
              Cancel Update
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-[#0e540b] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#0b4608] transition shadow-lg hover:shadow-[#0e540b]/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VegetableUpdateModal;
