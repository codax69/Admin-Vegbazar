import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import logo from "../../public/fav.png";

const AdminLogin = () => {
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      const userRole = localStorage.getItem("userRole");
      if (userRole === "admin") {
        navigate("/", { replace: true });
      }
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Admin email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Admin password must be at least 8 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    await loginApiCall();
  };

  const loginApiCall = async () => {
    setIsLoading(true);
    startLoading();

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Login successful, navigate to dashboard
        navigate("/", { replace: true });
      } else {
        // Login failed, show error
        setErrors({
          submit: result.error || "Admin login failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setErrors({
        submit: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const handleForgotPassword = () => {
    navigate("/admin/forgot-password");
  };

  const handleResendVerification = () => {
    navigate("/admin/resend-verification");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4 font-sans">
      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Admin Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-gray-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#0e540b] animate-pulse"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Secure Admin Access
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 md:p-10 relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0e540b]/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-10 relative z-10">
            <div className="mx-auto w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
              <img src={logo} alt="VegBazar" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400 font-medium">
              Please enter your credentials
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block pl-1">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@vegbazar.store"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-300 bg-white text-black font-medium placeholder-gray-300 ${errors.email
                    ? "border-red-500 focus:border-red-500 focus:shadow-sm"
                    : "border-gray-200 focus:border-[#0e540b] focus:shadow-lg focus:shadow-[#0e540b]/10"
                    } focus:outline-none`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-bold pl-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-300 bg-white text-black font-medium placeholder-gray-300 ${errors.password
                    ? "border-red-500 focus:border-red-500 focus:shadow-sm"
                    : "border-gray-200 focus:border-[#0e540b] focus:shadow-lg focus:shadow-[#0e540b]/10"
                    } focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.636 5.636m4.242 4.242L14.12 14.12m-4.242-4.242L14.12 14.12M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-bold pl-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  <div className="flex-1">
                    <span className="text-red-800 text-xs font-bold block">{errors.submit}</span>
                    {errors.submit.toLowerCase().includes("verify") && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="text-red-600 hover:text-red-800 text-xs font-bold underline mt-1 inline-block"
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform ${isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-[#0e540b] hover:shadow-xl hover:-translate-y-1"
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Verifying Access...
                </div>
              ) : (
                "Access Dashboard"
              )}
            </button>

            {/* Footer Links */}
            <div className="flex items-center justify-center pt-6 border-t border-gray-50">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
                >
                  Forgot Password?
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
                >
                  User Login
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Protected by VegBazar Admin System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;