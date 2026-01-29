import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || "";
  });

  // Setup axios interceptor for automatic token attachment
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If token expired and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const response = await axios.post(
                `${import.meta.env.VITE_API_SERVER_URL}/api/auth/refresh`,
                { refreshToken },
                { withCredentials: true }
              );

              if (response.data.success) {
                const newToken = response.data.data.accessToken;
                localStorage.setItem("token", newToken);
                setToken(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Verify token and get user data on mount
  useEffect(() => {
    const verifyToken = async () => {
      const accessToken = localStorage.getItem("token");

      if (!accessToken || accessToken.trim() === "") {
        setLoading(false);
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_SERVER_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          const userData = response.data.data;

          // Verify admin role
          if (userData.role !== "admin") {
            console.log("❌ Access denied. Admin privileges required.");
            logout();
            return;
          }

          setUser(userData);
          setToken(accessToken);
          setIsLoggedIn(true);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("userRole", userData.role);
        }
      } catch (error) {
        console.error("Token verification failed:", error.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL}/api/auth/admin/login`,
        credentials,
        { withCredentials: true }
      );

      if (response.data.success) {
        const { accessToken, refreshToken, user: userData } = response.data.data;

        // Verify admin role
        if (userData.role !== "admin") {
          throw new Error("Access denied. Admin privileges required.");
        }

        setToken(accessToken);
        setUser(userData);
        setIsLoggedIn(true);

        localStorage.setItem("token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userRole", userData.role);

        return { success: true, data: userData };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    setToken("");
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.clear();
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL}/api/auth/register`,
        { ...userData, role: "admin" },
        { withCredentials: true }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Registration failed",
      };
    }
  };

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    user,
    setUser,
    token,
    setToken,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}