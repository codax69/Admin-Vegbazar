import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL;

// Memoized Components for better performance
const Alert = React.memo(({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "error"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-green-50 border-green-200 text-green-700";
  const icon = type === "error" ? "✕" : "✓";

  return (
    <div
      className={`mb-6 p-4 border rounded-lg ${bgColor} animate-fade-in flex items-center justify-between`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{icon}</span>
        <span className="font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="text-xl hover:opacity-70 transition">
        ×
      </button>
    </div>
  );
});

Alert.displayName = "Alert";

const LoadingSpinner = React.memo(() => (
  <div className="p-12 text-center">
    <div className="inline-block animate-spin">
      <div className="h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
    </div>
    <p className="mt-4 text-gray-600 font-medium">Loading coupons...</p>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

const EmptyState = React.memo(() => (
  <div className="p-12 text-center">
    <svg
      className="mx-auto h-16 w-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p className="mt-4 text-gray-600 text-lg font-medium">No coupons found</p>
    <p className="text-gray-500 text-sm mt-1">
      Create your first coupon to get started!
    </p>
  </div>
));

EmptyState.displayName = "EmptyState";

const CouponRow = React.memo(({ coupon, onEdit, onDelete }) => {
  const isExpired =
    coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
  const usagePercentage = coupon.usageLimit
    ? (((coupon.usedCount || 0) / coupon.usageLimit) * 100).toFixed(0)
    : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-bold text-green-600">{coupon.code}</p>
          {coupon.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {coupon.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
          {coupon.discountType === "percentage" ? "%" : "₹"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-gray-900">
        {coupon.discountValue}
        {coupon.maxDiscount && (
          <span className="text-xs text-gray-500 block mt-1">
            Max: ₹{coupon.maxDiscount}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
        {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-block">
            {coupon.usedCount || 0}
            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
          </span>
          {coupon.usageLimit && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        {coupon.expiryDate ? (
          <div>
            <p
              className={`font-medium ${
                isExpired ? "text-red-600" : "text-gray-700"
              }`}
            >
              {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            {isExpired && <p className="text-xs text-red-500 mt-1">Expired</p>}
          </div>
        ) : (
          <span className="text-gray-500">No expiry</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            coupon.isActive && !isExpired
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {coupon.isActive && !isExpired ? "● Active" : "● Inactive"}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(coupon)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(coupon._id)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

CouponRow.displayName = "CouponRow";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    perUserLimit: "",
    expiryDate: "",
    isActive: true,
  });

  // Fetch all coupons with error handling
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/coupons`,
        {
          withCredentials: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Safely handle the response - ensure it's always an array
      const couponsData = response.data?.data.coupons;
      console.log(couponsData);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch (err) {
      const errorMsg =
        err.code === "ECONNABORTED"
          ? "Request timeout. Please check your connection."
          : err.response?.data?.message || "Failed to fetch coupons";
      setError(errorMsg);
      console.error("Fetch error:", err);
      setCoupons([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new coupon
  const handleCreateCoupon = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      // Validation
      if (!formData.code.trim()) {
        setError("Coupon code is required");
        return;
      }

      if (!formData.discountValue || formData.discountValue <= 0) {
        setError("Discount value must be greater than 0");
        return;
      }

      if (
        formData.discountType === "percentage" &&
        formData.discountValue > 100
      ) {
        setError("Percentage discount cannot exceed 100%");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          ...formData,
          code: formData.code.toUpperCase().trim(),
          discountValue: Number(formData.discountValue),
          maxDiscount: formData.maxDiscount
            ? Number(formData.maxDiscount)
            : undefined,
          minOrderAmount: formData.minOrderAmount
            ? Number(formData.minOrderAmount)
            : undefined,
          usageLimit: formData.usageLimit
            ? Number(formData.usageLimit)
            : undefined,
          perUserLimit: formData.perUserLimit
            ? Number(formData.perUserLimit)
            : undefined,
        };

        const response = await axios.post(
          `${API_BASE_URL}/api/coupons`,
          payload,
          {
            withCredentials: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCoupons((prev) => [response.data.data, ...prev]);
        setSuccess("Coupon created successfully! 🎉");
        resetForm();
        setShowForm(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to create coupon");
        console.error("Create error:", err);
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  // Update coupon
  const handleUpdateCoupon = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      setLoading(true);
      try {
        const payload = {
          ...formData,
          code: formData.code.toUpperCase().trim(),
          discountValue: Number(formData.discountValue),
          maxDiscount: formData.maxDiscount
            ? Number(formData.maxDiscount)
            : undefined,
          minOrderAmount: formData.minOrderAmount
            ? Number(formData.minOrderAmount)
            : undefined,
          usageLimit: formData.usageLimit
            ? Number(formData.usageLimit)
            : undefined,
          perUserLimit: formData.perUserLimit
            ? Number(formData.perUserLimit)
            : undefined,
        };

        const response = await axios.patch(
          `${API_BASE_URL}/api/coupons/${editingId}`,
          payload,
          { withCredentials: true },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCoupons((prev) =>
          prev.map((c) => (c._id === editingId ? response.data.data : c))
        );
        setSuccess("Coupon updated successfully! ✓");
        resetForm();
        setShowForm(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update coupon");
        console.error("Update error:", err);
      } finally {
        setLoading(false);
      }
    },
    [formData, editingId]
  );

  // Delete coupon
  const handleDeleteCoupon = useCallback(async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this coupon? This action cannot be undone."
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/api/coupons/${id}`,
        {
          withCredentials: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      setSuccess("Coupon deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete coupon");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Edit coupon
  const handleEditCoupon = useCallback((coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || "",
      minOrderAmount: coupon.minOrderAmount || "",
      usageLimit: coupon.usageLimit || "",
      perUserLimit: coupon.perUserLimit || "",
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate).toISOString().split("T")[0]
        : "",
      isActive: coupon.isActive,
    });
    setEditingId(coupon._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      maxDiscount: "",
      minOrderAmount: "",
      usageLimit: "",
      perUserLimit: "",
      expiryDate: "",
      isActive: true,
    });
    setEditingId(null);
  }, []);

  // Handle form input change
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Filtered and searched coupons
  const filteredCoupons = useMemo(() => {
    // Ensure coupons is always an array
    const couponsList = Array.isArray(coupons) ? coupons : [];

    return couponsList.filter((coupon) => {
      const matchesSearch =
        searchTerm === "" ||
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.description &&
          coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && coupon.isActive) ||
        (filterStatus === "inactive" && !coupon.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [coupons, searchTerm, filterStatus]);

  // Load coupons on component mount
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Coupon Management
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Create and manage discount coupons for your store
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              }
              setShowForm(!showForm);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-xl">{showForm ? "×" : "+"}</span>
            {showForm ? "Cancel" : "Add New Coupon"}
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "✏️ Edit Coupon" : "➕ Create New Coupon"}
            </h2>

            <form
              onSubmit={editingId ? handleUpdateCoupon : handleCreateCoupon}
              className="space-y-6"
            >
              {/* Code Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SUMMER50"
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all uppercase"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter coupon description"
                  rows="3"
                  maxLength={200}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder={
                      formData.discountType === "percentage"
                        ? "e.g., 50"
                        : "e.g., 500"
                    }
                    required
                    min="0"
                    max={
                      formData.discountType === "percentage" ? "100" : undefined
                    }
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Max Discount and Min Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Max Discount (₹)
                    {formData.discountType === "percentage" && (
                      <span className="text-green-600 ml-1">Recommended</span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="e.g., 100 (leave empty for unlimited)"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleInputChange}
                    placeholder="e.g., 1 (leave empty for unlimited)"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Expiry Date and Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-center pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-green-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">
                      Mark as Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "⏳ Saving..."
                    : editingId
                    ? "✓ Update Coupon"
                    : "+ Create Coupon"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
          >
            <option value="all">All Coupons</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">All Coupons</h2>
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                {filteredCoupons.length}{" "}
                {filteredCoupons.length === 1 ? "Coupon" : "Coupons"}
              </span>
            </div>
          </div>

          {loading && !showForm ? (
            <LoadingSpinner />
          ) : filteredCoupons.length === 0 ? (
            searchTerm || filterStatus !== "all" ? (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-600 text-lg font-medium">
                  No coupons match your search
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Min Order
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Usage
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Expiry
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCoupons.map((coupon) => (
                    <CouponRow
                      key={coupon._id}
                      coupon={coupon}
                      onEdit={handleEditCoupon}
                      onDelete={handleDeleteCoupon}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics Footer */}
        {filteredCoupons.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
              <p className="text-sm font-semibold opacity-90">Active Coupons</p>
              <p className="text-3xl font-bold mt-2">
                {coupons.filter((c) => c.isActive).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
              <p className="text-sm font-semibold opacity-90">Total Usage</p>
              <p className="text-3xl font-bold mt-2">
                {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
              <p className="text-sm font-semibold opacity-90">Expiring Soon</p>
              <p className="text-3xl font-bold mt-2">
                {
                  coupons.filter((c) => {
                    if (!c.expiryDate) return false;
                    const daysUntilExpiry = Math.ceil(
                      (new Date(c.expiryDate) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                  }).length
                }
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Smooth transitions for all interactive elements */
        button, input, select, textarea {
          transition: all 0.2s ease-in-out;
        }

        /* Custom scrollbar */
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        /* Loading spinner animation */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Pulse animation for active status */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Hover effects */
        tr:hover {
          background-color: #f9fafb;
          transition: background-color 0.15s ease;
        }

        /* Focus styles */
        input:focus, select:focus, textarea:focus {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        /* Better mobile table responsiveness */
        @media (max-width: 640px) {
          table {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CouponManagement;
