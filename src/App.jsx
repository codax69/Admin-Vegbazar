import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AddVegetableForm from "./components/AddVegetableForm";
import StockPanel from "./components/StockPanel";
import OfferPanel from "./components/OfferPanel";
import OrderTable from "./components/OrderTable";
import PrivateRoute from "./components/PrivateRoute";
import AdminRegisterPage from "./components/Register";
import Login from "./components/login";
import axios from "axios";
import { useLoading } from "./context/LoadingContext";
import { useAuth } from "./context/AuthContext";
import AdminTestimonials from "./components/AdminTestimonials";

function App() {
  const Navigate = useNavigate();
  const { setIsLoggedIn, token } = useAuth(); 
  const { startLoading, stopLoading } = useLoading();

  const getUser = async () => {
    startLoading();
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL}/api/auth/get-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        Navigate("/");
      }
      setIsLoggedIn(true);
    } catch (error) {
      console.log(`❌ Please Login First >> ${error.message}`);
      setIsLoggedIn(false);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<AdminRegisterPage />} />

      {/* Protected Dashboard routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />}>
          {/* Redirect from root to orders page */}
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrderTable />} />
          <Route path="/add-vegetable" element={<AddVegetableForm />} />
          <Route path="/stock" element={<StockPanel />} />
          <Route path="/offers" element={<OfferPanel />} />
          <Route path="/testimonials" element={<AdminTestimonials />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
