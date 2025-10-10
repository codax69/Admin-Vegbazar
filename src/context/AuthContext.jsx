import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      setToken(accessToken);
      setIsLoggedIn(true);
    }
  }, []);
 

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, token}}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };