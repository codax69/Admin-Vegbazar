import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Loading component
const LoadingSpinner = () => (
    <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f9fafb",
        }}
    >
        <div
            style={{
                width: "50px",
                height: "50px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #0e540b",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
            }}
        />
        <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

const PublicRoute = ({ children, redirectTo = "/" }) => {
    const { isLoggedIn, loading } = useAuth();

    // Show loading while checking auth state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Redirect to dashboard if already logged in
    if (isLoggedIn) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default PublicRoute;
