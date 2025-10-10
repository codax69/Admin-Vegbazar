import React, { useEffect, useState } from "react";
import axios from "axios";
import VegetableUpdateModal from "./VegetableUpdateModal";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

const VegetableTable = () => {
  const { token } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { startLoading, stopLoading } = useLoading();
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVegetable, setSelectedVegetable] = useState(null);

  const VegetableApiCall = async () => {
    try {
      startLoading();
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`
      );
      setVegetables(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vegetables:", error);
      setError("Failed to fetch vegetables");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vegetable?")) {
      return;
    }
    startLoading();
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await VegetableApiCall();
    } catch (error) {
      console.error("Delete failed:", error);
      setError(
        `Delete failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      stopLoading();
    }
  };

  const handleEdit = (vegetable) => {
    setSelectedVegetable(vegetable);
    setIsModalOpen(true);
    setError(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVegetable(null);
  };

  const handleVegetableUpdate = (updatedVegetable) => {
    // Update the vegetable in the local state
    setVegetables((prevVegetables) =>
      prevVegetables.map((veg) =>
        veg._id === updatedVegetable._id ? updatedVegetable : veg
      )
    );
  };

  // Quick stock update (inline editing for stock only)
  const handleQuickStockUpdate = async (id, newStock) => {
    if (newStock < 0) {
      setError("Stock cannot be negative");
      return;
    }
    startLoading();
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${id}`,
        { stockKg: parseFloat(newStock) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await VegetableApiCall();
    } catch (error) {
      console.error("Quick stock update failed:", error);
      setError(
        `Stock update failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    VegetableApiCall();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e540b]"></div>
          <div className="ml-3 text-lg">Loading vegetables...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-8 rounded-lg shadow-lg overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Vegetable Stock Levels
          </h2>
          <button
            onClick={VegetableApiCall}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {vegetables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No vegetables found</div>
            <button
              onClick={VegetableApiCall}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Stock (kg)
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Offer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Screen
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vegetables.map((veg) => (
                <tr
                  key={veg._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={veg.image}
                      alt={veg.name}
                      className="h-12 w-12 rounded-full object-cover border"
                      onError={(e) => {
                        e.target.src = "/placeholder-vegetable.png";
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {veg.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full
                          ${
                            veg.stockKg >= 10
                              ? "bg-green-100 text-green-800"
                              : veg.stockKg >= 2
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                      >
                        {veg.stockKg} kg
                      </span>
                      {veg.stockKg <= 2 && (
                        <span className="text-red-500 text-xs">Low Stock!</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    <div className="truncate" title={veg.description}>
                      {veg.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₹{veg.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {veg.offer || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {veg.screenNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(veg)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition text-sm"
                        title="Edit all details"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(veg._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition text-sm"
                        title="Delete vegetable"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">
              Total Vegetables
            </div>
            <div className="text-2xl font-bold text-green-800">
              {vegetables.length}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">
              Low Stock Items
            </div>
            <div className="text-2xl font-bold text-yellow-800">
              {vegetables.filter((v) => v.stockKg <= 2).length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Out of Stock</div>
            <div className="text-2xl font-bold text-red-800">
              {vegetables.filter((v) => v.stockKg === 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <VegetableUpdateModal
        vegetable={selectedVegetable}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleVegetableUpdate}
      />
    </>
  );
};

export default VegetableTable;
