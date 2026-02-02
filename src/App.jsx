import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AddVegetableForm from "./components/AddVegetableForm";
import StockPanel from "./components/StockPanel";
import BasketPanel from "./components/BasketPanel";
import OrderTable from "./components/OrderTable";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import AdminRegisterPage from "./components/Register";
import AdminLogin from "./components/AdminLogin";
import { useAuth } from "./context/AuthContext";
import AdminTestimonials from "./components/AdminTestimonials";
import CouponManagement from "./components/CouponManagement";
import AddCityForm from "./components/AddCityForm";
import VegetableTable from "./components/VegetableTable";
import VegetableOrdersReport from "./components/VegetableOrdersReport";
import OrderReportDash from "./components/OrderReportDash";

function App() {

  return (
    <Routes>
      {/* Public routes with redirect if logged in */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <AdminRegisterPage />
          </PublicRoute>
        }
      />

      {/* Redirect /admin/login to /login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      {/* Protected Dashboard routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<OrderTable />} />
          <Route path="add-vegetable" element={<AddVegetableForm />} />
          <Route path="stock" element={<StockPanel />} />
          <Route path="offers" element={<BasketPanel />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="coupon_codes" element={<CouponManagement />} />
          <Route path="add-city" element={<AddCityForm />} />
          <Route path="vegetables" element={<VegetableTable />} />
          <Route path="orderReport" element={<VegetableOrdersReport />} />
          <Route path="order-report-dash" element={<OrderReportDash />} />
        </Route>
      </Route>

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;