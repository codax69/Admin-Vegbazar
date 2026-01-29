import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Star,
  Trash2,
  Check,
  X,
  Quote,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = `${import.meta.env.VITE_API_SERVER_URL}/api/testimonials`;

const AdminTestimonials = () => {
  const { token } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // stores ID of updating item
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
      setUpdating(id);
      await axios.patch(
        `${API_URL}/${id}`,
        { [field]: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Optimistic update
      setTestimonials(prev => prev.map(t =>
        t._id === id ? { ...t, [field]: value } : t
      ));
    } catch (err) {
      console.error(err);
      alert("Failed to update testimonial");
      fetchTestimonials(); // Revert on fail
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={`${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">
              User Reviews
            </h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-1">
              Manage approvals and visibility
            </p>
          </div>

          <button
            onClick={fetchTestimonials}
            className="bg-white border-2 border-gray-200 text-black hover:border-[#0e540b] hover:text-[#0e540b] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0e540b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Reviews...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-gray-300 w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-500">No testimonials found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t._id}
                className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all duration-300 hover:shadow-lg group flex flex-col h-full ${t.isApproved && t.isPublished ? 'border-green-100 hover:border-[#0e540b]' : 'border-gray-100 hover:border-gray-300'
                  }`}
              >
                {/* User Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase text-white ${['bg-[#0e540b]', 'bg-blue-600', 'bg-purple-600', 'bg-orange-500'][t.name.length % 4]
                      }`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black">{t.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    {renderStars(t.rating)}
                  </div>
                </div>

                {/* Comment */}
                <div className="flex-1 mb-6 relative">
                  <Quote className="absolute -top-1 -left-1 text-gray-100 w-6 h-6 transform -scale-x-100" />
                  <p className="text-sm font-medium text-gray-600 pl-4 relative z-10 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${t.isApproved ? "bg-green-50 text-[#0e540b]" : "bg-red-50 text-red-500"
                    }`}>
                    {t.isApproved ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {t.isApproved ? "Approved" : "Pending"}
                  </div>

                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${t.isPublished ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                    }`}>
                    {t.isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                    {t.isPublished ? "Live" : "Hidden"}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-auto">
                  <button
                    onClick={() => handleUpdate(t._id, "isApproved", !t.isApproved)}
                    disabled={updating === t._id}
                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${t.isApproved
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "bg-[#0e540b] text-white hover:bg-green-900"
                      }`}
                  >
                    {updating === t._id ? (
                      <Loader2 className="animate-spin w-3 h-3" />
                    ) : t.isApproved ? (
                      <>
                        <X size={14} /> Unapprove
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Approve
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleUpdate(t._id, "isPublished", !t.isPublished)}
                    disabled={updating === t._id}
                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${t.isPublished
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {updating === t._id ? (
                      <Loader2 className="animate-spin w-3 h-3" />
                    ) : t.isPublished ? (
                      <>
                        <EyeOff size={14} /> Hide
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTestimonials;
