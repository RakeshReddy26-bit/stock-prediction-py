import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './pages/ProtectedRoute';
import Logo from './components/Logo';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
// Stocks page removed to keep it in a separate project

// Loading component
const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-white">
    <Logo size="lg" />
    <div className="mt-4 text-gray-600">Loading...</div>
  </div>
);

export default function App() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/washing" element={<Services category="washing" />} />
          <Route path="/iron" element={<Services category="iron" />} />
          <Route path="/leather" element={<Services category="leather" />} />
          <Route path="/alterations" element={<Services category="alterations" />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><div>Orders Page</div></ProtectedRoute>} />
          <Route path="/contact" element={<div>Contact page coming soon</div>} />
          {/* Stocks route removed to keep it separate */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  </Suspense>
    </>
  );
}