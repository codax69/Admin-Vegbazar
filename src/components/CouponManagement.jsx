import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Percent,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Tag,
  Clock,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL;

const CouponManagement = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID of the coupon being edited
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

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

  // Fetch all coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/coupons`,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );
      const couponsData = response.data?.data?.coupons;
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch (err) {
      setError(
        err.code === "ECONNABORTED"
          ? "Request timeout."
          : err.response?.data?.message || "Failed to fetch coupons"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
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
    setError("");
    setSuccess("");
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.code.trim()) return setError("Coupon code is required");
    if (!formData.discountValue || formData.discountValue <= 0)
      return setError("Valid discount value is required");
    if (formData.discountType === "percentage" && formData.discountValue > 100)
      return setError("Percentage cannot exceed 100%");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
      };

      if (editingId) {
        // Update
        const response = await axios.patch(
          `${API_BASE_URL}/api/coupons/${editingId}`,
          payload,
          { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
        );
        setCoupons((prev) =>
          prev.map((c) => (c._id === editingId ? response.data.data : c))
        );
        setSuccess("Coupon updated successfully!");
      } else {
        // Create
        const response = await axios.post(
          `${API_BASE_URL}/api/coupons`,
          payload,
          { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
        );
        setCoupons((prev) => [response.data.data, ...prev]);
        setSuccess("Coupon created successfully!");
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/coupons/${id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      setSuccess("Coupon deleted via API");
    } catch (err) {
      setError("Failed to delete coupon");
    }
  };

  // Filtering
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch =
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && c.isActive) ||
        (filterStatus === "inactive" && !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [coupons, searchTerm, filterStatus]);

  // Utility to copy code
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Copied ${code} to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
              <Ticket className="w-8 h-8 text-[#0e540b]" />
              Coupon Manager
            </h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-1 ml-1">
              Create and manage store discounts
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCoupons}
              className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              title="Refresh List"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-[#0e540b] text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-green-900/20 hover:bg-[#0b4209] hover:shadow-green-900/30 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Stats / Quick Filters (Optional placeholder for future stats) */}

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-bold text-sm text-gray-700 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                style={{ backgroundImage: 'none' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {/* Content */}
        {loading && !showForm ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-[#0e540b] animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading Coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Coupons Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              It looks like you haven't created any coupons yet, or no coupons match your current search.
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="text-[#0e540b] font-bold hover:underline"
            >
              Create your first coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => {
              const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
              const isNearExpiry = coupon.expiryDate && new Date(coupon.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && !isExpired;

              return (
                <div
                  key={coupon._id}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${!coupon.isActive ? 'border-gray-200 bg-gray-50 opacity-80' : 'border-gray-100 hover:border-green-200'
                    }`}
                >
                  {/* Decorative Header */}
                  <div className={`h-2 w-full ${!coupon.isActive ? 'bg-gray-300' : isExpired ? 'bg-red-500' : 'bg-[#0e540b]'}`} />

                  <div className="p-6">
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-2xl font-black tracking-tight ${!coupon.isActive ? 'text-gray-500' : 'text-gray-900'}`}>
                            {coupon.code}
                          </span>
                          <button onClick={() => copyToClipboard(coupon.code)} className="text-gray-300 hover:text-[#0e540b] transition-colors p-1">
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Tag size={12} />
                          {coupon.discountType === 'percentage' ? 'Percentage Off' : 'Flat Discount'}
                        </div>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-current/30 ${coupon.discountType === 'percentage'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-[#0e540b] to-emerald-600'
                        }`}>
                        {coupon.discountType === 'percentage' ? (
                          <div className="text-center leading-none">
                            <span className="text-lg">{coupon.discountValue}</span>
                            <span className="text-[10px] block opacity-80">%</span>
                          </div>
                        ) : (
                          <div className="text-center leading-none">
                            <span className="text-[10px] block opacity-80">₹</span>
                            <span className="text-lg">{coupon.discountValue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mb-6 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Min Spend</span>
                        <span className="font-bold text-gray-800">
                          {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'None'}
                        </span>
                      </div>
                      <div className="flex flex-col border-l border-gray-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Max Disc.</span>
                        <span className="font-bold text-gray-800">
                          {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'Uncapped'}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-gray-200 pt-3 mt-1 flex items-center gap-2">
                        <Clock size={14} className={isExpired ? 'text-red-500' : isNearExpiry ? 'text-orange-500' : 'text-gray-400'} />
                        <span className={`font-medium ${isExpired ? 'text-red-600' : isNearExpiry ? 'text-orange-600' : 'text-gray-600'}`}>
                          {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Expiry'}
                        </span>
                        {isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Expired</span>}
                      </div>
                    </div>

                    {/* Usage Progress */}
                    {(coupon.usageLimit || coupon.usedCount > 0) && (
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                          <span>Usage</span>
                          <span>{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0e540b] rounded-full"
                            style={{ width: `${coupon.usageLimit ? Math.min(((coupon.usedCount || 0) / coupon.usageLimit) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${coupon.isActive && !isExpired ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {coupon.isActive && !isExpired ? (
                          <><CheckCircle size={10} /> Active</>
                        ) : (
                          <><XCircle size={10} /> Inactive</>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-110 transition-all"
                          title="Edit Coupon"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all"
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                {editingId ? <Edit2 className="text-[#0e540b]" /> : <Plus className="text-[#0e540b]" />}
                {editingId ? "Edit Coupon" : "New Coupon"}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-6">

              {/* Code & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coupon Code</label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="SUMMER2024"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-bold uppercase tracking-wide"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount Type</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, discountType: 'percentage' }))}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.discountType === 'percentage' ? 'bg-white shadow text-[#0e540b]' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      Percentage %
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, discountType: 'fixed' }))}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.discountType === 'fixed' ? 'bg-white shadow text-[#0e540b]' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      Fixed Amount ₹
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Get flat 20% off on all vegetables this summer!"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium resize-none"
                  rows="2"
                />
              </div>

              {/* Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      {formData.discountType === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                    </div>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Order (₹)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Disc. (₹)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    disabled={formData.discountType === 'fixed'}
                    placeholder={formData.discountType === 'fixed' ? "N/A" : "Optional"}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Limits & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Uses</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="∞"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Per User</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleInputChange}
                    placeholder="∞"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${formData.isActive ? 'bg-[#0e540b]' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <span className="font-bold text-sm text-gray-700">Set as Active</span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-[#0e540b] hover:bg-[#0b4209] text-white font-bold rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : editingId ? "Update Coupon" : "Create Coupon"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
