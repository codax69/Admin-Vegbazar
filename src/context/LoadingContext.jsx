import React, { createContext, useState, useContext } from "react";

const LoadingContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => useContext(LoadingContext);
export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  
  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  return (
    <LoadingContext.Provider value={{ loading, startLoading, stopLoading }}>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div className="h-1 bg-[#0e540b] animate-loading-bar"></div>
        </div>
      )}

      {children}
    </LoadingContext.Provider>
  );
};
