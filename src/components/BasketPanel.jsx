import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import {
  X,
  Plus,
  Check,
  Package,
  Search,
  Tag,
  Edit2,
  Trash2,
  ShoppingBag,
  Weight,
  Loader2,
  Filter,
  AlertCircle,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

// Custom Input Component with modern styling
const FormInput = ({ label, error, required, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl transition-all duration-200 outline-none font-medium ${
        error
          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
          : "border-gray-200 focus:border-[#0e540b] focus:ring-4 focus:ring-green-50"
      }`}
    />
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
        <AlertCircle size={12} />
        {error.message}
      </p>
    )}
  </div>
);

// Custom Textarea Component
const FormTextarea = ({ label, error, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl transition-all duration-200 outline-none font-medium resize-none ${
        error
          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
          : "border-gray-200 focus:border-[#0e540b] focus:ring-4 focus:ring-green-50"
      }`}
    />
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
        <AlertCircle size={12} />
        {error.message}
      </p>
    )}
  </div>
);

// Vegetable Selection Card Component
const VegetableCard = ({ vegetable, isSelected, onToggle, isDisabled }) => {
  const isOutOfStock =
    vegetable.pricingType !== "set" && vegetable.stockKg <= 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled && !isSelected}
      className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${
        isSelected
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-[#0e540b] shadow-lg shadow-green-900/10 scale-[1.02]"
          : isDisabled
          ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
          : "bg-white border-gray-200 hover:border-green-300 hover:shadow-xl hover:scale-[1.02]"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-[#0e540b] text-white rounded-full p-1.5 shadow-lg z-10 animate-in zoom-in duration-200">
          <Check size={14} strokeWidth={3} />
        </div>
      )}

      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 overflow-hidden relative shadow-inner">
        <img
          src={vegetable.image || "/placeholder.png"}
          alt={vegetable.name}
          className={`w-full h-full object-cover ${
            isOutOfStock ? "grayscale opacity-60" : ""
          }`}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <h5
        className={`font-bold text-sm mb-2 truncate ${
          isSelected ? "text-[#0e540b]" : "text-gray-800"
        }`}
      >
        {vegetable.name}
      </h5>

      <div className="space-y-1.5">
        <p
          className={`text-xs font-semibold ${
            isOutOfStock ? "text-red-500" : "text-gray-500"
          }`}
        >
          {vegetable.pricingType === "set"
            ? `${vegetable.stockQuantity || 0} pieces`
            : `${vegetable.stockKg || 0}kg available`}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
              vegetable.pricingType === "set"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {vegetable.pricingType === "set" ? "Set" : "Weight"}
          </span>
          {vegetable.pricingType === "set" &&
            vegetable.sets &&
            vegetable.sets.length > 0 && (
              <span className="text-[9px] text-gray-500 font-medium">
                {vegetable.sets.map((s) => `${s.quantity}${s.unit}`).join(", ")}
              </span>
            )}
        </div>
      </div>
    </button>
  );
};

const BasketPanel = () => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  // Data States
  const [baskets, setBaskets] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [selectedVegetables, setSelectedVegetables] = useState([]);

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vegSearchTerm, setVegSearchTerm] = useState("");
  const [vegCategoryFilter, setVegCategoryFilter] = useState("all");

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      id: "",
      title: "",
      price: "",
      description: "",
      vegetableLimit: "",
      totalWeight: "",
      weight: "",
    },
  });

  const vegetableLimit = watch("vegetableLimit");

  // Category mapping
  const categories = {
    1: "Fresh Vegetables",
    2: "Leafy Greens",
    3: "Root Vegetables",
    4: "Exotic Vegetables",
    5: "Organic Vegetables",
  };

  // --- API Calls ---
  const fetchBaskets = async () => {
    startLoading();
    try {
      const response = await axios.get(`${API_SERVER_URL}/api/baskets`);
      setBaskets(
        response.data.data?.baskets || response.data.baskets || []
      );
    } catch (error) {
      console.error("Error fetching baskets:", error);
      alert("Failed to load baskets");
    } finally {
      stopLoading();
    }
  };

  const fetchVegetables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_SERVER_URL}/api/vegetables`);
      setVegetables(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vegetables:", error);
      alert("Failed to load vegetables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaskets();
  }, []);

  // --- Modal Handlers ---
  const openCreateModal = () => {
    fetchVegetables();
    setEditingBasket(null);
    setSelectedVegetables([]);
    reset({
      id: "",
      title: "",
      price: "",
      description: "",
      vegetableLimit: "",
      totalWeight: "",
      weight: "",
    });
    setShowModal(true);
  };

  const openEditModal = (basket) => {
    fetchVegetables();
    setEditingBasket(basket);

    // Extract vegetables from basket
    let currentVegs = [];
    if (Array.isArray(basket.vegetables) && basket.vegetables.length > 0) {
      currentVegs = basket.vegetables
        .map((v) => {
          if (typeof v === "object" && v !== null) {
            return v.vegetable || v;
          }
          return v;
        })
        .filter(Boolean);
    }

    setSelectedVegetables(currentVegs);
    reset({
      id: basket.id,
      title: basket.title,
      price: basket.price,
      description: basket.description || "",
      vegetableLimit: basket.vegetableLimit || "",
      totalWeight: basket.totalWeight || "",
      weight: basket.weight || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBasket(null);
    setSelectedVegetables([]);
    setVegSearchTerm("");
    setVegCategoryFilter("all");
    reset();
  };

  // --- Form Submit ---
  const onSubmit = async (data) => {
    // Validation
    if (selectedVegetables.length === 0) {
      alert("Please select at least one vegetable");
      return;
    }

    if (!editingBasket && baskets.some((b) => b.id === Number(data.id))) {
      alert("Basket ID already exists. Please use a different ID.");
      return;
    }

    try {
      startLoading();

      const payload = {
        id: parseInt(data.id),
        title: data.title,
        price: parseFloat(data.price),
        description: data.description || "",
        vegetableLimit: data.vegetableLimit
          ? parseInt(data.vegetableLimit)
          : null,
        vegetables: selectedVegetables.map((v) => ({
          vegetable: v._id,
          weight: "250g",
          quantity: 1,
        })),
        totalWeight: data.totalWeight ? parseFloat(data.totalWeight) : 0,
        weight: data.weight || "",
      };

      if (editingBasket) {
        // Update
        await axios.patch(
          `${API_SERVER_URL}/api/baskets/${editingBasket._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Basket updated successfully! ✅");
      } else {
        // Create
        await axios.post(`${API_SERVER_URL}/api/baskets/add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Basket created successfully! 🎉");
      }

      closeModal();
      fetchBaskets();
    } catch (error) {
      console.error("Error saving basket:", error);
      alert(error.response?.data?.message || "Failed to save basket");
    } finally {
      stopLoading();
    }
  };

  // --- Delete Basket ---
  const handleDeleteBasket = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this basket? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      startLoading();
      await axios.delete(`${API_SERVER_URL}/api/baskets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Basket deleted successfully");
      fetchBaskets();
    } catch (error) {
      console.error("Error deleting basket:", error);
      alert(error.response?.data?.message || "Failed to delete basket");
    } finally {
      stopLoading();
    }
  };

  // --- Vegetable Selection ---
  const toggleVegetable = (vegetable) => {
    const isSelected = selectedVegetables.some((v) => v._id === vegetable._id);
    const limit = parseInt(vegetableLimit) || Infinity;

    if (isSelected) {
      setSelectedVegetables((prev) =>
        prev.filter((v) => v._id !== vegetable._id)
      );
    } else {
      if (selectedVegetables.length < limit * 2) {
        setSelectedVegetables((prev) => [...prev, vegetable]);
      } else {
        alert(`Limit reached! Maximum ${limit * 2} items allowed.`);
      }
    }
  };

  // --- Filtered Lists ---
  const filteredBaskets = useMemo(() => {
    return baskets.filter(
      (basket) =>
        basket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        basket.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [baskets, searchTerm]);

  const filteredVegetables = useMemo(() => {
    return vegetables.filter((veg) => {
      const matchesSearch = veg.name
        ?.toLowerCase()
        .includes(vegSearchTerm.toLowerCase());
      const matchesCategory =
        vegCategoryFilter === "all" ||
        veg.screenNumber === parseInt(vegCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [vegetables, vegSearchTerm, vegCategoryFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#0e540b] to-green-700 p-2.5 rounded-2xl shadow-lg shadow-green-900/20">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              Basket Deals
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-2 ml-1">
              Create and manage combo packs for your customers
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-gradient-to-r from-[#0e540b] to-green-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-green-900/30 hover:shadow-2xl hover:shadow-green-900/40 active:scale-95 transition-all flex items-center gap-2 group"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Create New Basket
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400 w-5 h-5 ml-1" />
          <input
            type="text"
            placeholder="Search baskets by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none font-medium text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Baskets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBaskets.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={36} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Baskets Found
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Create your first basket to get started"}
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-2.5 bg-[#0e540b] text-white rounded-xl font-semibold text-sm hover:bg-green-800 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Basket
                </button>
              )}
            </div>
          ) : (
            filteredBaskets.map((basket) => (
              <div
                key={basket._id || basket.id}
                className="group bg-white rounded-3xl p-5 shadow-lg shadow-gray-200/50 border-2 border-gray-100 hover:shadow-2xl hover:shadow-green-900/10 hover:border-green-200 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
              >
                {/* Decorative Elements */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-green-100/40 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                
                {/* ID Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-1.5 rounded-xl text-xs font-black text-gray-500 shadow-sm border border-gray-200">
                  #{basket.id}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-4 pr-12">
                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 line-clamp-2">
                      {basket.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#0e540b] font-black text-2xl flex items-center">
                        <span className="text-sm mr-1">₹</span>
                        {basket.price}
                      </span>
                      {(basket.weight || basket.totalWeight) && (
                        <div className="flex gap-1.5">
                          {basket.totalWeight && (
                            <span className="bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                              <Weight size={10} />
                              {basket.totalWeight}kg
                            </span>
                          )}
                          {basket.weight && (
                            <span className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                              <Tag size={10} />
                              {basket.weight}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {basket.description || "No description provided."}
                  </p>

                  {/* Vegetables Preview */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-3.5 mb-4 flex-1 border border-gray-200/50">
                    <div className="flex justify-between items-center mb-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package size={11} />
                        Includes ({basket.vegetables?.length || 0})
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">
                        Limit: {basket.vegetableLimit || "∞"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {Array.isArray(basket.vegetables) &&
                      basket.vegetables.length > 0 ? (
                        basket.vegetables.map((veg, idx) => {
                          const vegName =
                            veg.vegetable?.name ||
                            veg.name ||
                            (typeof veg === "string"
                              ? `Item ${idx + 1}`
                              : "Unknown");
                          return (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-sm flex items-center gap-1 hover:border-green-300 transition-colors"
                            >
                              {vegName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          No items defined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t-2 border-gray-100 pt-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-1 md:group-hover:translate-y-0 mt-auto">
                    <button
                      onClick={() => openEditModal(basket)}
                      className="flex-1 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md"
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBasket(basket._id)}
                      className="flex-1 py-2.5 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
              {/* LEFT: Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full md:w-5/12 lg:w-4/12 bg-gradient-to-br from-white to-gray-50 flex flex-col border-r-2 border-gray-100"
              >
                {/* Form Header */}
                <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-br from-green-50 via-white to-green-50/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-[#0e540b] to-green-700 p-2 rounded-xl shadow-lg shadow-green-900/20">
                      {editingBasket ? (
                        <Edit2 className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">
                        {editingBasket ? "Edit Basket" : "Create New Basket"}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {editingBasket ? "Update basket details" : "Fill in the details below"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* ID & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Basket ID"
                      type="number"
                      required
                      disabled={!!editingBasket}
                      placeholder="e.g. 101"
                      {...register("id", {
                        required: "ID is required",
                        min: { value: 1, message: "ID must be positive" },
                      })}
                      error={errors.id}
                    />
                    <FormInput
                      label="Price"
                      type="number"
                      step="0.01"
                      required
                      placeholder="₹ 0.00"
                      {...register("price", {
                        required: "Price is required",
                        min: { value: 0.01, message: "Price must be positive" },
                      })}
                      error={errors.price}
                    />
                  </div>

                  {/* Title */}
                  <FormInput
                    label="Basket Title"
                    type="text"
                    required
                    placeholder="e.g. Weekly Fresh Combo"
                    {...register("title", {
                      required: "Title is required",
                      minLength: {
                        value: 3,
                        message: "Title must be at least 3 characters",
                      },
                    })}
                    error={errors.title}
                  />

                  {/* Description */}
                  <FormTextarea
                    label="Description"
                    rows="3"
                    placeholder="Describe what's special about this basket..."
                    {...register("description")}
                    error={errors.description}
                  />

                  {/* Limits & Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Veg Limit"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      {...register("vegetableLimit", {
                        min: {
                          value: 1,
                          message: "Limit must be at least 1",
                        },
                      })}
                      error={errors.vegetableLimit}
                    />
                    <FormInput
                      label="Total Weight"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="kg"
                      {...register("totalWeight", {
                        min: {
                          value: 0,
                          message: "Weight cannot be negative",
                        },
                      })}
                      error={errors.totalWeight}
                    />
                  </div>

                  {/* Weight Label */}
                  <FormInput
                    label="Weight Label"
                    type="text"
                    placeholder="e.g. 5kg Family Pack"
                    {...register("weight")}
                    error={errors.weight}
                  />

                  {/* Selected Vegetables Summary */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-100 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-green-900 flex items-center gap-2">
                        <Package size={14} />
                        Selected Items
                      </span>
                      <span className="bg-white text-green-700 text-xs font-black px-3 py-1 rounded-full shadow-md border border-green-200">
                        {selectedVegetables.length} Items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-50">
                      {selectedVegetables.length === 0 ? (
                        <div className="w-full text-center py-6">
                          <Package size={24} className="mx-auto text-green-300 mb-2" />
                          <p className="text-xs text-green-600/70 italic">
                            Select vegetables from the catalog →
                          </p>
                        </div>
                      ) : (
                        selectedVegetables.map((v) => (
                          <button
                            key={v._id}
                            type="button"
                            onClick={() => toggleVegetable(v)}
                            className="text-xs bg-white border-2 border-green-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-green-800 px-3 py-1.5 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-1.5 group"
                          >
                            {v.name}
                            <X
                              size={12}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="p-6 border-t-2 border-gray-100 bg-gray-50/80 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 rounded-xl transition-all border-2 border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-gradient-to-r from-[#0e540b] to-green-700 hover:from-green-700 hover:to-[#0e540b] text-white rounded-xl font-bold shadow-xl shadow-green-900/30 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {editingBasket ? (
                      <>
                        <Check size={16} />
                        Update Basket
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Basket
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* RIGHT: Vegetable Catalog */}
              <div className="w-full md:w-7/12 lg:w-8/12 bg-gray-50 flex flex-col max-h-[90vh] md:max-h-full">
                {/* Catalog Header */}
                <div className="p-6 bg-white border-b-2 border-gray-100">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#0e540b]" />
                        Vegetable Catalog
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Select items to add to your basket
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                      <X
                        size={20}
                        className="text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-all"
                      />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b-2 border-gray-100 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search vegetables..."
                        value={vegSearchTerm}
                        onChange={(e) => setVegSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-50 outline-none transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={vegCategoryFilter}
                        onChange={(e) => setVegCategoryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#0e540b] focus:ring-4 focus:ring-green-50 outline-none appearance-none cursor-pointer transition-all font-medium"
                      >
                        <option value="all">All Categories</option>
                        {Object.entries(categories).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Vegetable Grid */}
                <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-br from-gray-50 to-white">
                  {loading && vegetables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="animate-spin text-[#0e540b] w-10 h-10 mb-4" />
                      <p className="text-sm text-gray-500 font-medium">
                        Loading vegetables...
                      </p>
                    </div>
                  ) : filteredVegetables.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={36} className="text-gray-300" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">
                        No vegetables found
                      </h4>
                      <p className="text-sm text-gray-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredVegetables.map((veg) => {
                        const isSelected = selectedVegetables.some(
                          (v) => v._id === veg._id
                        );
                        const limit = parseInt(vegetableLimit) || Infinity;
                        const isDisabled =
                          !isSelected &&
                          selectedVegetables.length >= limit * 2;

                        return (
                          <VegetableCard
                            key={veg._id}
                            vegetable={veg}
                            isSelected={isSelected}
                            onToggle={() =>
                              !isDisabled && toggleVegetable(veg)
                            }
                            isDisabled={isDisabled}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketPanel;