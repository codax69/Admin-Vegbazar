import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Check,
  Package,
  DollarSign,
  Search,
  Tag,
  Edit2,
  Trash2,
  ShoppingBag,
  Weight,
  AlertCircle,
  Loader2,
  Info,
  Filter
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

const OfferPanel = () => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  // Data States
  const [offers, setOffers] = useState([]);
  const [vegetables, setVegetables] = useState([]);

  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false); // Local loading for form operations
  const [searchTerm, setSearchTerm] = useState(""); // For offers list
  const [vegSearchTerm, setVegSearchTerm] = useState(""); // For modal veg selection
  const [vegCategoryFilter, setVegCategoryFilter] = useState("all");

  // Form State
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({
    id: "",
    title: "",
    price: "",
    description: "",
    vegetableLimit: "",
    selectedVegetables: [],
    totalWeight: "",
    weight: "",
  });

  // Category mapping
  const categories = {
    all: "All Categories",
    1: "Fresh Vegetables",
    2: "Leafy Greens",
    3: "Root Vegetables",
    4: "Exotic Vegetables",
    5: "Organic Vegetables",
  };

  // --- API Calls ---

  const fetchOffers = async () => {
    startLoading();
    try {
      const response = await axios.get(`${API_SERVER_URL}/api/offers`);
      setOffers(response.data.data.offers || response.data.offers || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      // toast.error("Failed to load offers");
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // --- Handlers ---

  const handleOpenAddForm = () => {
    fetchVegetables();
    setShowAddForm(true);
  };

  const handleOpenEditForm = async (offer) => {
    fetchVegetables();

    let currentVegs = [];
    if (Array.isArray(offer.vegetables) && offer.vegetables.length > 0) {
      if (typeof offer.vegetables[0] === 'object') {
        currentVegs = offer.vegetables;
      }
    }

    setSelectedOffer({
      ...offer,
      selectedVegetables: currentVegs,
    });

    setShowEditForm(true);
  };

  // Create Offer
  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!newOffer.id || !newOffer.title || !newOffer.price) return alert("Required fields missing");
    if (newOffer.selectedVegetables.length === 0) return alert("Select at least one vegetable");

    if (offers.some(o => o.id === Number(newOffer.id))) return alert("Offer ID already exists");

    try {
      startLoading();
      const payload = {
        id: parseInt(newOffer.id),
        title: newOffer.title,
        price: parseFloat(newOffer.price),
        description: newOffer.description,
        vegetableLimit: parseInt(newOffer.vegetableLimit) || null,
        vegetables: newOffer.selectedVegetables.map(v => v._id),
        totalWeight: newOffer.totalWeight,
        weight: newOffer.weight
      };

      await axios.post(`${API_SERVER_URL}/api/offers/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Offer created successfully! 🎉");
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error(error);
      alert("Failed to create offer");
    } finally {
      stopLoading();
    }
  };

  // Update Offer
  const handleUpdateOffer = async () => {
    if (!selectedOffer.title || !selectedOffer.price) return alert("Required fields missing");
    if (selectedOffer.selectedVegetables.length === 0) return alert("Select at least one vegetable");

    try {
      startLoading();
      const payload = {
        id: parseInt(selectedOffer.id),
        title: selectedOffer.title,
        price: parseFloat(selectedOffer.price),
        description: selectedOffer.description,
        vegetableLimit: parseInt(selectedOffer.vegetableLimit) || null,
        vegetables: selectedOffer.selectedVegetables.map(v => v._id || v),
        totalWeight: selectedOffer.totalWeight,
        weight: selectedOffer.weight
      };

      await axios.patch(`${API_SERVER_URL}/api/offers/${selectedOffer._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Offer updated successfully! ✅");
      resetEditForm();
      fetchOffers();
    } catch (error) {
      console.error(error);
      alert("Failed to update offer");
    } finally {
      stopLoading();
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure? This action is irreversible.")) return;
    try {
      startLoading();
      await axios.delete(`${API_SERVER_URL}/api/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOffers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete offer");
    } finally {
      stopLoading();
    }
  };

  // Helpers
  const resetForm = () => {
    setNewOffer({
      id: "", title: "", price: "", description: "", vegetableLimit: "",
      selectedVegetables: [], totalWeight: "", weight: ""
    });
    setShowAddForm(false);
    setVegSearchTerm("");
  };

  const resetEditForm = () => {
    setSelectedOffer(null);
    setShowEditForm(false);
    setVegSearchTerm("");
  };

  // Vegetable Selection Logic (Shared)
  const toggleVegetable = (vegetable, isEdit) => {
    const targetObj = isEdit ? selectedOffer : newOffer;
    const setTargetObj = isEdit ? setSelectedOffer : setNewOffer;

    const isSelected = targetObj.selectedVegetables.some(v => v._id === vegetable._id);
    const limit = parseInt(targetObj.vegetableLimit) || Infinity;

    if (isSelected) {
      setTargetObj(prev => ({
        ...prev,
        selectedVegetables: prev.selectedVegetables.filter(v => v._id !== vegetable._id)
      }));
    } else {
      if (targetObj.selectedVegetables.length < limit * 2) {
        setTargetObj(prev => ({
          ...prev,
          selectedVegetables: [...prev.selectedVegetables, vegetable]
        }));
      } else {
        alert(`Limit reached (Max ${limit * 2} items allowed)`);
      }
    }
  };

  // --- Filtered Lists ---
  const filteredOffers = useMemo(() => {
    return offers.filter(offer =>
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offers, searchTerm]);

  const filteredVegetables = useMemo(() => {
    return vegetables.filter(veg => {
      const matchesSearch = veg.name.toLowerCase().includes(vegSearchTerm.toLowerCase());
      const matchesCategory = vegCategoryFilter === 'all' || veg.screenNumber === parseInt(vegCategoryFilter);
      return matchesSearch && matchesCategory;
      // Removed `&& veg.stockKg > 0` to show ALL items as requested
    });
  }, [vegetables, vegSearchTerm, vegCategoryFilter]);

  // --- Renderers ---

  const OfferFormModal = ({ isEdit }) => {
    const currentData = isEdit ? selectedOffer : newOffer;
    const setData = isEdit ? setSelectedOffer : setNewOffer;

    // Ensure we have valid data object to avoid crashes
    if (!currentData) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">

          {/* LEFT: Form Details */}
          <div className="w-full md:w-5/12 lg:w-4/12 flex flex-col border-r border-gray-100 bg-white z-10">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {isEdit ? <Edit2 className="text-[#0e540b]" size={20} /> : <Plus className="text-[#0e540b]" size={20} />}
                {isEdit ? "Edit Offer" : "New Offer"}
              </h3>
              <button onClick={isEdit ? resetEditForm : resetForm} className="md:hidden p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">ID <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={currentData.id}
                    onChange={e => setData({ ...currentData, id: e.target.value })}
                    disabled={isEdit}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-bold"
                    placeholder="#"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={currentData.price}
                    onChange={e => setData({ ...currentData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-bold text-[#0e540b]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={e => setData({ ...currentData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-bold"
                  placeholder="e.g. Weekly Combo"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea
                  value={currentData.description}
                  onChange={e => setData({ ...currentData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-medium resize-none"
                  rows="3"
                  placeholder="Details about the offer..."
                />
              </div>

              {/* Configs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Veg Limit</label>
                  <input
                    type="number"
                    value={currentData.vegetableLimit}
                    onChange={e => setData({ ...currentData, vegetableLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-medium"
                    placeholder="Unltd"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Total Kg</label>
                  <input
                    type="number"
                    value={currentData.totalWeight}
                    onChange={e => setData({ ...currentData, totalWeight: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-medium"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Weight Label</label>
                <input
                  type="text"
                  value={currentData.weight}
                  onChange={e => setData({ ...currentData, weight: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0e540b] outline-none font-medium"
                  placeholder="e.g. 5kg Pack"
                />
              </div>

              {/* Selected Veg Summary */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-green-800 uppercase">Selected Content</span>
                  <span className="bg-white text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {currentData.selectedVegetables.length} Items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {currentData.selectedVegetables.length === 0 ? (
                    <span className="text-xs text-green-600/60 italic">Select vegetables from the list...</span>
                  ) : (
                    currentData.selectedVegetables.map(v => (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => toggleVegetable(v, isEdit)}
                        className="text-[10px] bg-white border border-green-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-green-800 px-2 py-1 rounded-md shadow-sm transition-all flex items-center gap-1 group"
                      >
                        {v.name}
                        <X size={10} className="hidden group-hover:block" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                type="button"
                onClick={isEdit ? resetEditForm : resetForm}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={isEdit ? handleUpdateOffer : handleAddOffer}
                className="flex-[2] py-3 bg-[#0e540b] hover:bg-[#0b4209] text-white rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all text-sm"
              >
                {isEdit ? "Update Changes" : "Create Offer"}
              </button>
            </div>
          </div>

          {/* RIGHT: Veg Selection */}
          <div className="w-full md:w-7/12 lg:w-8/12 bg-gray-50 flex flex-col h-full">
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center gap-4">
              <div className="hidden md:block">
                <h4 className="font-bold text-gray-800">Add Items</h4>
                <p className="text-xs text-gray-400">Select vegetables for this combo</p>
              </div>
              <button onClick={isEdit ? resetEditForm : resetForm} className="hidden max-md:flex p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
              <button onClick={isEdit ? resetEditForm : resetForm} className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={vegSearchTerm}
                  onChange={e => setVegSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#0e540b] outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={vegCategoryFilter}
                  onChange={e => setVegCategoryFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#0e540b] outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categories).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 content-start">
              {loading && vegetables.length === 0 ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0e540b]" /></div>
              ) : filteredVegetables.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No vegetables found matching filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredVegetables.map(veg => {
                    const isSelected = currentData.selectedVegetables.some(v => v._id === veg._id);

                    const isDisabled = !isSelected &&
                      (currentData.vegetableLimit && currentData.selectedVegetables.length >= (parseInt(currentData.vegetableLimit) * 2));

                    const isOutOfStock = veg.stockKg <= 0;

                    return (
                      <button
                        key={veg._id}
                        type="button"
                        onClick={() => !isDisabled && toggleVegetable(veg, isEdit)}
                        disabled={isDisabled && !isSelected}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all group ${isSelected
                          ? 'bg-green-50 border-[#0e540b] shadow-sm'
                          : isDisabled
                            ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed text-gray-400'
                            : 'bg-white border-transparent hover:border-green-200 hover:shadow-md'
                          }`}
                      >
                        {isSelected && <div className="absolute top-2 right-2 bg-[#0e540b] text-white rounded-full p-0.5 z-10"><Check size={10} strokeWidth={4} /></div>}

                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                          <img
                            src={veg.image || "/placeholder.png"}
                            alt={veg.name}
                            className={`w-full h-full object-cover mix-blend-multiply ${isOutOfStock ? 'grayscale' : ''}`}
                            onError={e => e.target.style.display = 'none'}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <h5 className={`font-bold text-sm truncate ${isSelected ? 'text-[#0e540b]' : 'text-gray-800'}`}>{veg.name}</h5>
                        <p className={`text-[10px] font-medium ${isOutOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                          Stock: {veg.stockKg}kg
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#0e540b]" />
              Offer Deals
            </h1>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide mt-1 ml-1">
              Manage combo packs and special offers
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="px-5 py-2.5 bg-[#0e540b] text-white rounded-lg font-bold text-sm uppercase tracking-wide shadow-md shadow-green-900/10 hover:bg-[#0b4209] hover:shadow-green-900/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            New Offer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400 w-4 h-4 ml-2" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none font-medium text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOffers.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <ShoppingBag size={40} className="mx-auto text-gray-200 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Offers Found</h3>
              <p className="text-gray-500 text-xs">Create a new offer to get started.</p>
            </div>
          ) : (
            filteredOffers.map((offer) => (
              <div key={offer._id || offer.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-50 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                {/* Decorative ID */}
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1.5 rounded-bl-xl text-[10px] font-bold text-gray-400">
                  #{offer.id}
                </div>

                <div className="flex justify-between items-start mb-3 pr-8">
                  <div className="w-full">
                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{offer.title}</h3>

                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[#0e540b] font-extrabold text-lg flex items-center">
                        <span className="text-xs mr-0.5">₹</span>{offer.price}
                      </span>

                      {/* Show both Weight Label and Total Kg if available */}
                      {(offer.weight || offer.totalWeight) && (
                        <div className="flex gap-1">
                          {offer.totalWeight && (
                            <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5">
                              <Weight size={9} /> {offer.totalWeight}kg
                            </span>
                          )}
                          {offer.weight && (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5">
                              <Tag size={9} /> {offer.weight}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <p className="text-[11px] text-gray-500 mb-3 line-clamp-2 min-h-[1.7rem] leading-relaxed">{offer.description || "No description provided."}</p>

                  {/* Veggies Preview - Show ALL */}
                  <div className="bg-gray-50 rounded-lg p-2.5 mb-3 flex-1">
                    <div className="flex justify-between items-center mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      <span>Includes ({offer.vegetables?.length || 0})</span>
                      <span>Limit: {offer.vegetableLimit || "∞"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {Array.isArray(offer.vegetables) && offer.vegetables.length > 0 ? (
                        offer.vegetables.map((veg, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-semibold shadow-sm flex items-center gap-1">
                            {veg.name || (typeof veg === 'string' ? "Item " + idx : "Unknown")}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No items defined</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 pt-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 mt-auto">
                  <button
                    onClick={() => handleOpenEditForm(offer)}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer._id)}
                    className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {showAddForm && <OfferFormModal isEdit={false} />}
        {showEditForm && <OfferFormModal isEdit={true} />}

      </div>
    </div>
  );
};

export default OfferPanel;
