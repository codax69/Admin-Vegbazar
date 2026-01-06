import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
import CouponManagement from "./components/CouponManagement";
import AddCityForm from "./components/AddCityForm";
import VegetableTable from "./components/VegetableTable";
import VegetableOrdersReport from "./components/VegetableOrdersReport";
import OrderReportDash from "./components/OrderReportDash";

// Create a wrapper component for public routes
const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn, token, isLoggedIn } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const getUser = async () => {
    // Skip auth check on public routes
    if (location.pathname === "/login" || location.pathname === "/register") {
      return;
    }

    // Only check if token exists
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

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
        setIsLoggedIn(true);
        // REMOVED: navigate("/") - This was causing the redirect on refresh
      }
    } catch (error) {
      console.log(`❌ Please Login First >> ${error.message}`);
      setIsLoggedIn(false);
      // Only redirect to login if on a protected route
      if (location.pathname !== "/login" && location.pathname !== "/register") {
        navigate("/login");
      }
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    getUser();
  }, []); // Empty dependency array - only runs once on mount

  return (
    <Routes>
      {/* Public routes with redirect if logged in */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Dashboard routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Navigate to="/" replace />} />
          <Route path="orders" element={<OrderTable />} />
          <Route path="add-vegetable" element={<AddVegetableForm />} />
          <Route path="stock" element={<StockPanel />} />
          <Route path="offers" element={<OfferPanel />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="coupon_codes" element={<CouponManagement />} />
          <Route path="add-city" element={<AddCityForm />} />
          <Route path="vegetables" element={<VegetableTable />} />
          <Route path="orderReport" element={<VegetableOrdersReport />} />
          <Route path="order-report-dash" element={<OrderReportDash />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;