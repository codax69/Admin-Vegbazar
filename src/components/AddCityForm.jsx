import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  LayoutGrid,
  Navigation
} from "lucide-react";

const AddCityForm = () => {
  const { token } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [city, setCity] = useState("");
  const [areas, setAreas] = useState([""]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingCity, setEditingCity] = useState(null);
  const [editCity, setEditCity] = useState("");
  const [editAreas, setEditAreas] = useState([]);

  // Fetch cities from server
  const fetchCities = async () => {
    setLoading(true);
    startLoading();
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/cities/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCities(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cities");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleAreaChange = (index, value) => {
    const newAreas = [...areas];
    newAreas[index] = value;
    setAreas(newAreas);
  };

  const handleAddArea = () => setAreas([...areas, ""]);
  const handleRemoveArea = (index) =>
    setAreas(areas.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name: city,
      areas: areas.filter((a) => a.trim() !== ""),
    };

    try {
      startLoading();
      await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL}/api/cities/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("City added successfully!");
      setCity("");
      setAreas([""]);
      fetchCities();
    } catch (err) {
      console.error(err);
      alert("Error adding city");
    } finally {
      stopLoading();
    }
  };

  const handleDeleteCity = async (cityId) => {
    if (window.confirm("Are you sure you want to delete this city?")) {
      try {
        startLoading();
        await axios.delete(
          `${import.meta.env.VITE_API_SERVER_URL}/api/cities/${cityId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("City deleted successfully!");
        fetchCities();
      } catch (err) {
        console.error(err);
        alert("Error deleting city");
      } finally {
        stopLoading();
      }
    }
  };

  const handleEditCity = (cityData) => {
    setEditingCity(cityData._id);
    setEditCity(cityData.name || cityData.city);
    setEditAreas(cityData.areas || [""]);
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setEditCity("");
    setEditAreas([]);
  };

  const handleEditAreaChange = (index, value) => {
    const newAreas = [...editAreas];
    newAreas[index] = value;
    setEditAreas(newAreas);
  };

  const handleAddEditArea = () => setEditAreas([...editAreas, ""]);
  const handleRemoveEditArea = (index) =>
    setEditAreas(editAreas.filter((_, i) => i !== index));

  const handleUpdateCity = async () => {
    const updateData = {
      name: editCity,
      areas: editAreas.filter((a) => a.trim() !== ""),
    };

    try {
      startLoading();
      await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/cities/${editingCity}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("City updated successfully!");
      setEditingCity(null);
      setEditCity("");
      setEditAreas([]);
      fetchCities();
    } catch (err) {
      console.error(err);
      alert("Error updating city");
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Header - Mobile Only or Top */}
        <div className="lg:col-span-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">
              Service Locations
            </h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-1">
              Manage delivery cities and areas
            </p>
          </div>
          {/* Stats Summary */}
          {cities.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-[#0e540b]/10 flex items-center justify-center text-[#0e540b]">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Cities</p>
                  <p className="text-lg font-black text-black">{cities.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-[#0e540b]/10 flex items-center justify-center text-[#0e540b]">
                  <Navigation size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Areas</p>
                  <p className="text-lg font-black text-black">
                    {cities.reduce((total, city) => total + (city.areas?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left Column: Add City Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-black text-black uppercase tracking-wide mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#0e540b]">
                <Plus size={18} />
              </div>
              Add New City
            </h2>

            <div className="space-y-5">
              {/* City Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">
                  City Name
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#0e540b] transition-all font-medium text-sm focus:outline-none"
                />
              </div>

              {/* Areas */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">
                  Delivery Areas / Pincodes
                </label>
                {areas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => handleAreaChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#0e540b] transition-all font-medium text-sm focus:outline-none"
                      placeholder={`Area ${index + 1}`}
                    />
                    {areas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveArea(index)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddArea}
                  className="text-xs font-bold text-[#0e540b] hover:text-green-800 flex items-center gap-1 pl-1"
                >
                  <Plus size={14} /> Add Another Area
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#0e540b] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-green-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Save Location
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cities List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-black uppercase tracking-wide flex items-center gap-2">
              <LayoutGrid size={18} className="text-gray-400" />
              Existing Locations
            </h2>
            <button
              onClick={fetchCities}
              className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
            >
              Refresh List
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          {loading && cities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 border-dashed">
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#0e540b] animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 border-dashed">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">No service locations added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cities.map((cityData) => (
                <div
                  key={cityData._id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 hover:border-[#0e540b] transition-all duration-300 group"
                >
                  {editingCity === cityData._id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wide text-[#0e540b]">
                          Editing Location
                        </h3>
                        <button
                          onClick={handleCancelEdit}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1 mb-1">City</label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#0e540b]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1 mb-1">Areas</label>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                            {editAreas.map((area, areaIndex) => (
                              <div key={areaIndex} className="flex gap-2">
                                <input
                                  type="text"
                                  value={area}
                                  onChange={(e) => handleEditAreaChange(areaIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#0e540b]"
                                />
                                <button
                                  onClick={() => handleRemoveEditArea(areaIndex)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={handleAddEditArea}
                            className="text-xs font-bold text-[#0e540b] hover:underline mt-2 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Area
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleUpdateCity}
                          className="flex-1 bg-[#0e540b] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-900 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#0e540b] transition-colors duration-300">
                            <MapPin className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-black leading-tight">
                              {cityData.name || cityData.city}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                              {cityData.areas?.length || 0} Areas Covered
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditCity(cityData)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCity(cityData._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        {cityData.areas && cityData.areas.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {cityData.areas.slice(0, 5).map((area, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 border border-gray-100"
                              >
                                {area}
                              </span>
                            ))}
                            {cityData.areas.length > 5 && (
                              <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-400 border border-gray-100">
                                +{cityData.areas.length - 5} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No specific areas defined</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCityForm;