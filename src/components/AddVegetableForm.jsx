import axios from "axios";
import React, { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const AddVegetableForm = () => {
  const {token} = useAuth()
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    vegetableName: "",
    stock: "",
    image: "",
    offer: "",
    vegBazarPrice1kg: "",
    marketPrice1kg: "",
    description: "",
    screen: "1",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // Helper function to calculate prices from 1kg price
  const calculatePrices = (price1kg) => {
    if (!price1kg || isNaN(price1kg)) return null;
    const p = parseFloat(price1kg);
    return {
      weight1kg: p,
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.vegetableName.trim()) {
      newErrors.vegetableName = "Vegetable name is required";
    }

    if (!formData.stock || parseFloat(formData.stock) <= 0) {
      newErrors.stock = "Stock must be greater than 0";
    }

    if (
      !formData.vegBazarPrice1kg ||
      parseFloat(formData.vegBazarPrice1kg) <= 0
    ) {
      newErrors.vegBazarPrice1kg = "VegBazar price must be greater than 0";
    }

    if (!formData.marketPrice1kg || parseFloat(formData.marketPrice1kg) <= 0) {
      newErrors.marketPrice1kg = "Market price must be greater than 0";
    }

    if (!formData.image.trim()) {
      newErrors.image = "Image URL is required";
    } else {
      try {
        new URL(formData.image);
      } catch {
        newErrors.image = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    startLoading();

    try {
      const vegBazarPrice = parseFloat(formData.vegBazarPrice1kg);
      const marketPrice = parseFloat(formData.marketPrice1kg);

      // Calculate all price variants
      const prices = calculatePrices(vegBazarPrice);
      const marketPrices = calculatePrices(marketPrice);

      const payload = {
        name: formData.vegetableName,
        image: formData.image,
        stockKg: parseFloat(formData.stock),
        description: formData.description,
        offer: formData.offer,
        prices,
        marketPrices,
        screenNumber: parseInt(formData.screen),
      };

      await addVegetable(payload);
      alert("Vegetable added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding vegetable:", error);
      alert("Failed to add vegetable. Please try again.");
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const resetForm = () => {
    setFormData({
      vegetableName: "",
      stock: "",
      image: "",
      screen: "1",
      offer: "",
      vegBazarPrice1kg: "",
      marketPrice1kg: "",
      description: "",
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const addVegetable = async (payload) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/add`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.message || "Server error occurred"
        );
      } else if (error.request) {
        throw new Error("Network error - please check your connection");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
  };

  // Calculate prices for preview
  const vegBazarPrices = calculatePrices(formData.vegBazarPrice1kg);
  const marketPrices_display = calculatePrices(formData.marketPrice1kg);
  const savings = calculateSavings(
    formData.vegBazarPrice1kg,
    formData.marketPrice1kg
  );

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4 sm:py-6 flex flex-col justify-center">
      {/* Mobile Header */}
      <div className="block sm:hidden mb-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Add New Vegetable
        </h1>
      </div>

      <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl mx-auto">
        <div className="relative px-4 py-6 sm:px-6 sm:py-10 bg-white shadow-lg rounded-lg sm:rounded-3xl">
          <div className="w-full">
            {/* Desktop Header */}
            <div className="hidden sm:flex items-center space-x-5 mb-6">
              <div className="block pl-2 font-semibold text-xl sm:text-2xl text-gray-700">
                <h2 className="leading-relaxed">Add New Vegetable</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the details to add a new vegetable to your inventory
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Fields */}
              <div className="space-y-4 sm:space-y-6">
                {/* Vegetable Name */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Vegetable Name *
                  </label>
                  <input
                    type="text"
                    value={formData.vegetableName}
                    onChange={(e) =>
                      handleInputChange("vegetableName", e.target.value)
                    }
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors ${
                      errors.vegetableName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    }`}
                    placeholder="e.g., Tomato, Onion, Carrot"
                    disabled={isLoading}
                  />
                  {errors.vegetableName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.vegetableName}
                    </p>
                  )}
                </div>

                {/* Stock Amount */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Stock (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors ${
                      errors.stock
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    }`}
                    placeholder="Enter stock"
                    disabled={isLoading}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                  )}
                </div>

                {/* Price Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* VegBazar Price (1kg) */}
                  <div className="flex flex-col">
                    <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                      VegBazar Price (1kg) ₹ *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.vegBazarPrice1kg}
                      onChange={(e) =>
                        handleInputChange("vegBazarPrice1kg", e.target.value)
                      }
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border border-blue-300 bg-blue-50 rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors ${
                        errors.vegBazarPrice1kg
                          ? "focus:ring-red-500 focus:border-red-500"
                          : "focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="Enter VegBazar price"
                      disabled={isLoading}
                    />
                    {errors.vegBazarPrice1kg && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vegBazarPrice1kg}
                      </p>
                    )}
                  </div>

                  {/* Market Price (1kg) */}
                  <div className="flex flex-col">
                    <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
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
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-300 bg-green-50 rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors ${
                        errors.marketPrice1kg
                          ? "focus:ring-red-500 focus:border-red-500"
                          : "focus:ring-green-500 focus:border-green-500"
                      }`}
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

                {/* Savings Summary */}
                {formData.vegBazarPrice1kg && formData.marketPrice1kg && (
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
                            formData.marketPrice1kg / formData.vegBazarPrice1kg
                          ).toFixed(2)}
                          x
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* VegBazar Prices Display */}
                {vegBazarPrices && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      VegBazar Prices (Auto-calculated)
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

                {/* Market Prices Display */}
                {marketPrices_display && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      Market Prices (Auto-calculated)
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

                {/* Image URL */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange("image", e.target.value)}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors ${
                      errors.image
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    }`}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                  />
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                  )}
                  {formData.image && !errors.image && (
                    <div className="mt-3 flex justify-center sm:justify-start">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Category/Screen
                  </label>
                  <select
                    value={formData.screen}
                    onChange={(e) =>
                      handleInputChange("screen", e.target.value)
                    }
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors bg-white"
                    disabled={isLoading}
                  >
                    <option value="1">Category 1 - Fresh Vegetables</option>
                    <option value="2">Category 2 - Leafy Greens</option>
                    <option value="3">Category 3 - Root Vegetables</option>
                    <option value="4">Category 4 - Exotic Vegetables</option>
                    <option value="5">Category 5 - Seasonal Vegetables</option>
                  </select>
                </div>

                {/* Offer */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Special Offer
                  </label>
                  <input
                    type="text"
                    value={formData.offer}
                    onChange={(e) => handleInputChange("offer", e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors"
                    placeholder="e.g., 10% off, Buy 2 Get 1 Free"
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows="3"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors resize-none"
                    placeholder="Enter vegetable description (optional)"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="w-full sm:w-1/2 px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-1/2 px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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

            {/* Form Preview */}
            {(formData.vegetableName || formData.stock || formData.image) && (
              <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-3">
                  Live Preview
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-green-200">
                  <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    {formData.image && !errors.image && (
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-white shadow-md"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {formData.vegetableName || "Vegetable Name"}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                        <p className="text-sm sm:text-base text-gray-600">
                          Stock: {formData.stock || "0"} kg
                        </p>
                        {formData.vegBazarPrice1kg && (
                          <p className="text-sm sm:text-base text-blue-600 font-bold">
                            VegBazar: ₹{formData.vegBazarPrice1kg}
                          </p>
                        )}
                        {formData.marketPrice1kg && (
                          <p className="text-sm sm:text-base text-green-600 font-bold">
                            Market: ₹{formData.marketPrice1kg}
                          </p>
                        )}
                      </div>
                      {formData.offer && (
                        <p className="text-sm sm:text-base text-blue-600 font-medium mt-1">
                          {formData.offer}
                        </p>
                      )}
                      {formData.description && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">
                          {formData.description}
                        </p>
                      )}
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
