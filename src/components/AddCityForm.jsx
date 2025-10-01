import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoading } from "../context/loadingContext";

const AddCityForm = () => {
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
        `${import.meta.env.VITE_API_SERVER_URL}/api/cities/`
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
        formData
      );
      alert("✅ City added successfully!");
      setCity("");
      setAreas([""]);
      fetchCities();
    } catch (err) {
      console.error(err);
      alert("❌ Error adding city");
    } finally {
      stopLoading();
    }
  };

  const handleDeleteCity = async (cityId) => {
    if (window.confirm("Are you sure you want to delete this city?")) {
      try {
        startLoading();
        await axios.delete(
          `${import.meta.env.VITE_API_SERVER_URL}/api/cities/${cityId}`
        );
        alert("✅ City deleted successfully!");
        fetchCities();
      } catch (err) {
        console.error(err);
        alert("❌ Error deleting city");
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
      await axios.patch(`/api/cities/${editingCity}`, updateData);
      alert("✅ City updated successfully!");
      setEditingCity(null);
      setEditCity("");
      setEditAreas([]);
      fetchCities();
    } catch (err) {
      console.error(err);
      alert("❌ Error updating city");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* ✅ Add City Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-600 mb-4 text-center">
          🌿 Add City & Areas
        </h2>

        <div className="space-y-4">
          {/* City Input */}
          <div>
            <label className="block text-sm font-medium text-green-700">
              City Name
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
              placeholder="Enter city name"
            />
          </div>

          {/* Areas */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              City Areas
            </label>
            {areas.map((area, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={area}
                  onChange={(e) => handleAreaChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
                  placeholder={`Area ${index + 1}`}
                />
                {areas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(index)}
                    className="text-red-500 hover:text-red-600 p-1 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddArea}
              className="mt-2 text-green-600 font-medium hover:underline"
            >
              + Add Another Area
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200 font-medium"
          >
            ✅ Save City
          </button>
        </div>
      </div>

      {/* Cities Display */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-600">
            🏙️ Cities & Areas
          </h2>
          <button
            onClick={fetchCities}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-green-500">
              Loading cities...
            </div>
          </div>
        ) : cities.length === 0 ? (
          <div className="text-center py-8 text-green-500">
            <div className="text-4xl mb-2">🏙️</div>
            <p>No cities added yet. Add your first city above!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((cityData, index) => (
              <div
                key={cityData._id || index}
                className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                {editingCity === cityData._id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-green-700">
                        ✏️ Editing City
                      </h3>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        City Name
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full px-3 py-1 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Areas
                      </label>
                      {editAreas.map((area, areaIndex) => (
                        <div
                          key={areaIndex}
                          className="flex items-center gap-1 mb-1"
                        >
                          <input
                            type="text"
                            value={area}
                            onChange={(e) =>
                              handleEditAreaChange(areaIndex, e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-400 focus:outline-none"
                            placeholder={`Area ${areaIndex + 1}`}
                          />
                          {editAreas.length > 1 && (
                            <button
                              onClick={() => handleRemoveEditArea(areaIndex)}
                              className="text-red-500 hover:text-red-600 text-xs w-5 h-5 flex items-center justify-center"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddEditArea}
                        className="text-green-600 hover:underline text-xs mt-1"
                      >
                        + Add Area
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateCity}
                        className="flex-1 bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        💾 Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                        📍 {cityData.name || cityData.city}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditCity(cityData)}
                          className="text-green-600 hover:text-green-700 text-sm p-1 hover:bg-green-50 rounded transition-colors"
                          title="Edit city"
                        >
                          ✏️
                        </button>
                        {cityData._id && (
                          <button
                            onClick={() => handleDeleteCity(cityData._id)}
                            className="text-red-400 hover:text-red-600 text-sm p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete city"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-green-600 font-medium mb-2 flex items-center gap-1">
                        🏘️ Areas ({cityData.areas?.length || 0}):
                      </div>
                      {cityData.areas && cityData.areas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cityData.areas.map((area, areaIndex) => (
                            <span
                              key={areaIndex}
                              className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-green-100 hover:border-green-200 transition-colors"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm italic">
                          No areas specified
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-green-100">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        📅{" "}
                        {cityData.createdAt
                          ? `Added: ${new Date(
                              cityData.createdAt
                            ).toLocaleDateString()}`
                          : `City #${index + 1}`}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {cities.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold text-center text-gray-700 mb-4">
            📊 Summary Statistics
          </h3>
          <div className="flex items-center justify-center gap-8 text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {cities.length}
              </div>
              <div className="text-sm text-green-700 font-medium">Cities</div>
            </div>
            <div className="w-px h-12 bg-green-300"></div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {cities.reduce(
                  (total, city) => total + (city.areas?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Total Areas
              </div>
            </div>
            <div className="w-px h-12 bg-blue-300"></div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {(
                  cities.reduce(
                    (total, city) => total + (city.areas?.length || 0),
                    0
                  ) / cities.length
                ).toFixed(1)}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                Avg Areas/City
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCityForm;
