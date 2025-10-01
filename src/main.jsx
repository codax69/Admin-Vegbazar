import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LoadingProvider } from './context/loadingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingProvider>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </LoadingProvider>
  </StrictMode>,
)