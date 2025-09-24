import React, { useEffect, useState } from "react";
import axios from "axios";

const VegetableTable = () => {
  const [vegetables, setVegetables] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    price: "",
    stockKg: "",
  });

  const VegetableApiCall = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/vegetables`);
      setVegetables(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vegetables:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${id}`);
      await VegetableApiCall(); // Refresh after delete
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleEdit = (vegetable) => {
    setEditingId(vegetable._id);
    setEditValues({
      price: vegetable.price,
      stockKg: vegetable.stockKg,
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_SERVER_URL}/api/vegetables/${editingId}`, editValues);
      setEditingId(null);
      await VegetableApiCall(); // Refresh after update
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ price: "", stockKg: "" });
  };

  useEffect(() => {
    VegetableApiCall();
  }, []); // Remove vegetables dependency to prevent infinite loop

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Vegetable Stock Levels
      </h2>

      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock (kg)</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Offer</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Screen</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {vegetables?.map((veg) => (
            <tr key={veg._id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <img
                  src={veg.image}
                  alt={veg.name}
                  className="h-12 w-12 rounded-full object-cover border"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {veg.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === veg._id ? (
                  <input
                    type="number"
                    min="0"
                    value={editValues.stockKg}
                    onChange={(e) => setEditValues({ ...editValues, stockKg: e.target.value })}
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  <span
                    className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full
                      ${
                        veg.stockKg > 20
                          ? "bg-green-100 text-green-800"
                          : veg.stockKg > 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                  >
                    {veg.stockKg} kg
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                {veg.description || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                {editingId === veg._id ? (
                  <input
                    type="number"
                    min="0"
                    value={editValues.price}
                    onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  `₹${veg.price}`
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {veg.offer || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {veg.screenNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {editingId === veg._id ? (
                  <div className="space-x-2">
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(veg)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(veg._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VegetableTable;