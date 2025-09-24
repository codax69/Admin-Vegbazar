import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AddVegetableForm from './components/AddVegetableForm'
import StockPanel from './components/StockPanel'
import OfferPanel from './components/OfferPanel'
import OrderTable from './components/OrderTable'
import PrivateRoute from './components/PrivateRoute'
import AdminRegisterPage from './components/Register'
import Login from './components/login'


function App() {
  console.log(import.meta.env.VITE_API_SERVER_URL);
  return (
    <Routes>
      {/* Public routes */}
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<AdminRegisterPage />} />

      {/* Protected Dashboard routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />}>
          {/* Redirect from root to orders page */}
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<OrderTable />} />
          <Route path="add-vegetable" element={<AddVegetableForm />} />
          <Route path="stock" element={<StockPanel />} />
          <Route path="offers" element={<OfferPanel />} />
        </Route>
      </Route>

      {/* Catch all route for 404 */}
    </Routes>
  )
}

export default App