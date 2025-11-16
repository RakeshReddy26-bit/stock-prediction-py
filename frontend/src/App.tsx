import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Services from './pages/Services';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile';
import Referral from './pages/Referral';
import { TaskManagement } from './pages/TaskManagement';

// Minimal App routes for the frontend workspace so commonly used pages are reachable during dev.
export default function App() {
  return (
    <>
      <nav style={{ padding: 12, background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Link to="/" style={{ marginRight: 12 }}>Services</Link>
        <Link to="/cart" style={{ marginRight: 12 }}>Cart</Link>
        <Link to="/checkout" style={{ marginRight: 12 }}>Checkout</Link>
        <Link to="/dashboard" style={{ marginRight: 12 }}>Dashboard</Link>
        <Link to="/profile" style={{ marginRight: 12 }}>Profile</Link>
        <Link to="/referral" style={{ marginRight: 12 }}>Referral</Link>
        <Link to="/tasks" style={{ marginRight: 12 }}>Tasks</Link>
      </nav>

      <Routes>
      <Route path="/" element={<Services />} />
      <Route path="/services" element={<Services />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/tasks" element={<TaskManagement />} />
      {/* Fallback to services for unknown routes while developing */}
      <Route path="*" element={<Services />} />
    </Routes>
    </>
  );
}
