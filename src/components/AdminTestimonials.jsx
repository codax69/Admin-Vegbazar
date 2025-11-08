import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:4000/api/testimonials";
const AdminTestimonials = () => {
  const { token } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all testimonials
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.data;
      if (data?.data?.testimonials) {
        setTestimonials(data.data.testimonials);
      } else {
        setTestimonials([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  // Update testimonial (Approve/Publish)
  const handleUpdate = async (id, field, value) => {
    try {
      setUpdating(true);
      await axios.patch(
        `${API_URL}/${id}`,
        { [field]: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchTestimonials();
    } catch (err) {
      console.error(err);
      alert("Failed to update testimonial");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8 font-assistant">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-poppins font-bold text-[#0e540b] mb-6">
          🗣️ Manage Testimonials
        </h1>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-[#0e540b]" size={32} />
          </div>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-gray-500 text-sm md:text-base">
            No testimonials found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base border-collapse">
              <thead className="bg-[#0e540b] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-center">Rating</th>
                  <th className="px-3 py-2 text-left">Comment</th>
                  <th className="px-3 py-2 text-center">Approved</th>
                  <th className="px-3 py-2 text-center">Published</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b hover:bg-gray-50 transition-all"
                  >
                    <td className="px-3 py-2 font-semibold">{t.name}</td>
                    <td className="px-3 py-2 text-gray-600">{t.email}</td>
                    <td className="px-3 py-2 text-center font-amiko">
                      ⭐ {t.rating}
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-sm truncate">
                      {t.comment}
                    </td>

                    {/* Approval Status */}
                    <td className="px-3 py-2 text-center">
                      {t.isApproved ? (
                        <CheckCircle className="text-green-600 w-5 h-5 mx-auto" />
                      ) : (
                        <XCircle className="text-red-500 w-5 h-5 mx-auto" />
                      )}
                    </td>

                    {/* Publish Status */}
                    <td className="px-3 py-2 text-center">
                      {t.isPublished ? (
                        <CheckCircle className="text-green-600 w-5 h-5 mx-auto" />
                      ) : (
                        <XCircle className="text-red-500 w-5 h-5 mx-auto" />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-center flex justify-center gap-2">
                      <button
                        onClick={() =>
                          handleUpdate(t._id, "isApproved", !t.isApproved)
                        }
                        disabled={updating}
                        className={`px-3 py-1.5 rounded-md text-white text-xs font-amiko ${
                          t.isApproved ? "bg-gray-500" : "bg-green-700"
                        } hover:opacity-90 transition`}
                      >
                        {t.isApproved ? "Unapprove" : "Approve"}
                      </button>

                      <button
                        onClick={() =>
                          handleUpdate(t._id, "isPublished", !t.isPublished)
                        }
                        disabled={updating}
                        className={`px-3 py-1.5 rounded-md text-white text-xs font-amiko ${
                          t.isPublished ? "bg-gray-500" : "bg-blue-700"
                        } hover:opacity-90 transition`}
                      >
                        {t.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTestimonials;
