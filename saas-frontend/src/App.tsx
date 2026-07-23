import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import TopUp from './pages/TopUp'
import TopUpResult from './pages/TopUpResult'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import WalletDashboard from './pages/WalletDashboard'
import Checkout from './pages/Checkout'
import SecureCheckout from './pages/SecureCheckout'
import CreateCheckout from './pages/CreateCheckout'
import CreateOrder from './pages/CreateOrder'
import Orders from './pages/Orders'
import Notifications from './pages/Notifications'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken')
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        
        {/* Secure Checkout - Standalone, no auth required, token-based */}
        <Route path="/pay/:token" element={<SecureCheckout />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/topup" element={<TopUp />} />
          <Route path="/topup/success" element={<TopUpResult />} />
          <Route path="/topup/failure" element={<TopUpResult />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/wallet" element={<WalletDashboard />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/create-checkout" element={<CreateCheckout />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
