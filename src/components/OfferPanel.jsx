import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Plus, Check, Package, DollarSign } from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const OfferPanel = () => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
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
  // Vegetable selection states
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Category mapping based on screenNumber
  const categories = {
    all: "All Categories",
    1: "Fresh Vegetables",
    2: "Leafy Greens",
    3: "Root Vegetables",
    4: "Exotic Vegetables",
    5: "Organic Vegetables",
  };

  // Fetch offers from API
  const offersApiCall = async () => {
    startLoading();
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/offers`
      );
      setOffers(response.data.data.offers || response.data.offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      alert("Failed to fetch offers");
    } finally {
      stopLoading();
    }
  };

  // Fetch vegetables from server
  const fetchVegetables = async () => {
    try {
      startLoading();
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`
      );
      setVegetables(response.data.data);
    } catch (error) {
      console.error("Error fetching vegetables:", error);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    offersApiCall();
  }, []);

  // Handle opening add form
  const handleOpenAddForm = () => {
    setShowAddForm(true);
    fetchVegetables();
  };

  // Handle offer selection for editing
  const handleOfferChange = async (offerId) => {
    const offer = offers.find((o) => o._id === offerId);
    if (offer) {
      // Fetch vegetables first
      await fetchVegetables();
      
      // Prepare selected vegetables - handle both populated and unpopulated data
      let selectedVegs = [];
      if (Array.isArray(offer.vegetables) && offer.vegetables.length > 0) {
        if (typeof offer.vegetables[0] === 'object' && offer.vegetables[0]._id) {
          // Already populated
          selectedVegs = offer.vegetables;
        } else {
          // Need to fetch vegetable details
          try {
            const vegResponse = await axios.get(
              `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`
            );
            const allVegetables = vegResponse.data.data;
            selectedVegs = allVegetables.filter(v => 
              offer.vegetables.includes(v._id) || offer.vegetables.includes(v.name)
            );
          } catch (error) {
            console.error("Error fetching vegetable details:", error);
          }
        }
      }

      setSelectedOffer({
        ...offer,
        selectedVegetables: selectedVegs,
      });
      setShowEditForm(true);
    }
  };

  // Handle offer update
  const handleUpdateOffer = async () => {
    if (!selectedOffer.title || !selectedOffer.price) {
      alert("Please fill in all required fields!");
      return;
    }

    if (selectedOffer.selectedVegetables.length === 0) {
      alert("Please select at least one vegetable");
      return;
    }

    startLoading();
    try {
      const offerData = {
        id: parseInt(selectedOffer.id),
        title: selectedOffer.title,
        price: parseFloat(selectedOffer.price),
        description: selectedOffer.description,
        vegetableLimit: parseInt(selectedOffer.vegetableLimit) || null,
        vegetables: selectedOffer.selectedVegetables.map((v) => v._id),
        totalWeight: selectedOffer.totalWeight,
        weight: selectedOffer.weight,
      };

      await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/offers/${selectedOffer._id}`,
        offerData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     
      alert("Offer updated successfully!");
      setShowEditForm(false);
      setSelectedOffer(null);
      offersApiCall(); // Refresh the list
    } catch (error) {
      console.error("Error updating offer:", error);
      alert("Failed to update offer");
    } finally {
      stopLoading();
    }
  };

  // Filter vegetables based on search term and category
  const filteredVegetables = vegetables.filter((veg) => {
    const matchesSearch =
      veg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veg.description &&
        veg.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      veg.screenNumber === parseInt(selectedCategory);

    const hasStock = veg.stockKg > 0;

    return matchesSearch && matchesCategory && hasStock;
  });

  // Handle vegetable selection/deselection for ADD form
  const handleVegetableSelect = (vegetable) => {
    const isSelected = newOffer.selectedVegetables.some(
      (v) => v._id === vegetable._id
    );
    const vegetableLimit = parseInt(newOffer.vegetableLimit) || Infinity;

    if (isSelected) {
      setNewOffer((prev) => ({
        ...prev,
        selectedVegetables: prev.selectedVegetables.filter(
          (v) => v._id !== vegetable._id
        ),
      }));
    } else {
      if (newOffer.selectedVegetables.length < vegetableLimit * 2) {
        setNewOffer((prev) => ({
          ...prev,
          selectedVegetables: [...prev.selectedVegetables, vegetable],
        }));
      } else {
        alert(`You can only select up to ${vegetableLimit * 2} vegetables.`);
      }
    }
  };

  // Handle vegetable selection/deselection for EDIT form
  const handleEditVegetableSelect = (vegetable) => {
    const isSelected = selectedOffer.selectedVegetables.some(
      (v) => v._id === vegetable._id
    );
    const vegetableLimit = parseInt(selectedOffer.vegetableLimit) || Infinity;

    if (isSelected) {
      setSelectedOffer((prev) => ({
        ...prev,
        selectedVegetables: prev.selectedVegetables.filter(
          (v) => v._id !== vegetable._id
        ),
      }));
    } else {
      if (selectedOffer.selectedVegetables.length < vegetableLimit * 2) {
        setSelectedOffer((prev) => ({
          ...prev,
          selectedVegetables: [...prev.selectedVegetables, vegetable],
        }));
      } else {
        alert(`You can only select up to ${vegetableLimit * 2} vegetables.`);
      }
    }
  };

  // Handle form submission
  const handleAddOffer = async (e) => {
    e.preventDefault();

    if (!newOffer.id || !newOffer.title || !newOffer.price) {
      alert("Please fill in all required fields (ID, Title, Price)");
      return;
    }

    if (newOffer.selectedVegetables.length === 0) {
      alert("Please select at least one vegetable");
      return;
    }

    if (offers.some((offer) => offer.id === Number(newOffer.id))) {
      alert("Offer ID already exists!");
      return;
    }

    const offerData = {
      id: parseInt(newOffer.id),
      title: newOffer.title,
      price: parseFloat(newOffer.price),
      description: newOffer.description,
      vegetableLimit: parseInt(newOffer.vegetableLimit) || null,
      vegetables: newOffer.selectedVegetables.map((v) => v._id),
      totalWeight: newOffer.totalWeight,
      weight: newOffer.weight,
    };

    try {
      await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL}/api/offers/add`,
        offerData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      resetForm();
      alert("Offer created successfully!");
      offersApiCall();
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Error creating offer. Please try again.");
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setNewOffer({
      id: "",
      title: "",
      price: "",
      description: "",
      vegetableLimit: "",
      selectedVegetables: [],
      totalWeight: "",
      weight: "",
    });
    setShowAddForm(false);
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // Reset edit form
  const resetEditForm = () => {
    setSelectedOffer(null);
    setShowEditForm(false);
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // Handle offer deletion
  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) {
      return;
    }

    startLoading();
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_SERVER_URL}/api/offers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Offer deleted successfully ✅");
      offersApiCall();
    } catch (error) {
      console.error("Error deleting offer:", error);
      alert("Failed to delete offer ❌");
    } finally {
      stopLoading();
    }
  };

  // Render offer form (reusable for both add and edit)
  const renderOfferForm = (isEdit = false) => {
    const currentOffer = isEdit ? selectedOffer : newOffer;
    const setCurrentOffer = isEdit ? setSelectedOffer : setNewOffer;
    const handleSubmit = isEdit ? handleUpdateOffer : handleAddOffer;
    const handleClose = isEdit ? resetEditForm : resetForm;
    const handleVegSelect = isEdit ? handleEditVegetableSelect : handleVegetableSelect;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {isEdit ? "Edit Offer" : "Create New Offer"}
            </h3>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex h-full max-h-[calc(90vh-80px)]">
            {/* Form Section */}
            <div className="w-2/5 p-6 border-r border-gray-200 overflow-y-auto">
              <div className="space-y-4">
                {/* ID and Price Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={currentOffer.id}
                      onChange={(e) =>
                        setCurrentOffer({ ...currentOffer, id: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter offer ID"
                      disabled={isEdit}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentOffer.price}
                      onChange={(e) =>
                        setCurrentOffer({ ...currentOffer, price: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="₹0.00"
                      required
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentOffer.title}
                    onChange={(e) =>
                      setCurrentOffer({ ...currentOffer, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter offer title"
                    required
                  />
                </div>

                {/* Vegetable Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vegetable Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentOffer.vegetableLimit}
                    onChange={(e) =>
                      setCurrentOffer({
                        ...currentOffer,
                        vegetableLimit: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Maximum vegetables allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for unlimited selection
                  </p>
                </div>

                {/* Total Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={currentOffer.totalWeight || ""}
                    onChange={(e) =>
                      setCurrentOffer({
                        ...currentOffer,
                        totalWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Total weight of the offer"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={currentOffer.weight || ""}
                    onChange={(e) =>
                      setCurrentOffer({
                        ...currentOffer,
                        weight: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Weight description"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentOffer.description}
                    onChange={(e) =>
                      setCurrentOffer({
                        ...currentOffer,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe your offer..."
                    maxLength="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {currentOffer.description?.length || 0}/500 characters
                  </p>
                </div>

                {/* Selected Vegetables Display */}
                {currentOffer.selectedVegetables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Vegetables ({currentOffer.selectedVegetables.length}
                      {currentOffer.vegetableLimit && `/${currentOffer.vegetableLimit}`})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentOffer.selectedVegetables.map((veg) => (
                        <span
                          key={veg._id}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {veg.name}
                          <button
                            type="button"
                            onClick={() => handleVegSelect(veg)}
                            className="hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                  >
                    {isEdit ? "Update Offer" : "Create Offer"}
                  </button>
                </div>
              </div>
            </div>

            {/* Vegetable Selection Section */}
            <div className="w-3/5 p-6 overflow-y-auto bg-gray-50">
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vegetables
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading vegetables...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredVegetables.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No vegetables found
                    </p>
                  ) : (
                    filteredVegetables.map((vegetable) => {
                      const isSelected = currentOffer.selectedVegetables.some(
                        (v) => v._id === vegetable._id
                      );
                      const isDisabled =
                        vegetable.stockKg === 0 ||
                        (!isSelected &&
                          currentOffer.vegetableLimit * 2 &&
                          currentOffer.selectedVegetables.length >=
                            parseInt(currentOffer.vegetableLimit * 2));

                      return (
                        <div
                          key={vegetable._id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-green-100 border-green-500 shadow-sm"
                              : isDisabled
                              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
                              : "bg-white border-gray-200 hover:border-green-300 hover:shadow-sm"
                          }`}
                          onClick={() => !isDisabled && handleVegSelect(vegetable)}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={vegetable.image || "/api/placeholder/60/60"}
                              alt={vegetable.name}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                e.target.src = "/api/placeholder/60/60";
                              }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {vegetable.name}
                                </h4>
                                {isSelected && (
                                  <Check size={16} className="text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              <p className="text-xs text-gray-500 mb-2">
                                {categories[vegetable.screenNumber] ||
                                  "Category " + vegetable.screenNumber}
                              </p>

                              {vegetable.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {vegetable.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                                    <DollarSign size={12} />₹{vegetable.price}/kg
                                  </span>
                                  <span
                                    className={`text-xs flex items-center gap-1 ${
                                      vegetable.stockKg > 10
                                        ? "text-green-600"
                                        : vegetable.stockKg > 0
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    <Package size={12} />
                                    {vegetable.stockKg}kg stock
                                  </span>
                                </div>

                                {vegetable.offer && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    {vegetable.offer}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Offers</h2>

        {/* Add Offer Button */}
        <div className="mb-4">
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Offer
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {offers.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No offers available
              </li>
            ) : (
              offers.map((offer) => (
                <li key={offer._id || offer.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{offer.title}</p>
                      <p className="text-sm text-gray-500">{offer.description}</p>
                      <p className="text-sm text-gray-500">₹{offer.price}</p>
                      <p className="text-xs text-gray-400">
                        Vegetables:{" "}
                        {Array.isArray(offer.vegetables) && offer.vegetables.length > 0
                          ? offer.vegetables
                              .map((veg) => veg.name || veg)
                              .join(", ")
                          : "N/A"}
                      </p>
                      {offer.vegetableLimit && (
                        <p className="text-xs text-blue-500">
                          Limit: {offer.vegetableLimit} vegetables
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOfferChange(offer._id)}
                        className="px-4 py-2 border border-green-500 rounded-md text-sm font-medium text-green-500 hover:bg-green-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Add Offer Modal */}
        {showAddForm && renderOfferForm(false)}

        {/* Edit Offer Modal */}
        {showEditForm && selectedOffer && renderOfferForm(true)}
      </div>
    </div>
  );
};

export default OfferPanel;