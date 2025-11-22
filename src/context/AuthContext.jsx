import React, { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    return localStorage.getItem("token") || "";
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    // Fix: Check if token exists and is not empty
    if (accessToken && accessToken.trim() !== "") {
      setToken(accessToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Optional: Add login and logout functions
  const login = (newToken) => {
    setToken(newToken);
    setIsLoggedIn(true);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setToken("");
    setIsLoggedIn(false);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        setIsLoggedIn, 
        token, 
        setToken,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}