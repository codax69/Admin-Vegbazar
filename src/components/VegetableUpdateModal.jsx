import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoading } from "../context/loadingContext";
const VegetableUpdateModal = ({ vegetable, isOpen, onClose, onUpdate }) => {
  const {startLoading, stopLoading} = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stockKg: "",
    description: "",
    image: "",
    offer: "",
    screenNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Populate form when vegetable changes
  useEffect(() => {
    if (vegetable) {
      setFormData({
        name: vegetable.name || "",
        price: vegetable.price || "",
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update image preview when image URL changes
    if (name === "image") {
      setImagePreview(value);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.price || parseFloat(formData.price) < 0) errors.push("Valid price is required");
    if (!formData.stockKg || parseFloat(formData.stockKg) < 0) errors.push("Valid stock is required");
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }
    startLoading()
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stockKg: parseFloat(formData.stockKg),
        description: formData.description.trim(),
        image: formData.image.trim(),
        offer: formData.offer.trim(),
        screenNumber: formData.screenNumber,
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${vegetable._id}`,
        updateData
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                  placeholder="e.g., A1, B2, C3"
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
                  rows="4"
                  placeholder="Brief description of the vegetable..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
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