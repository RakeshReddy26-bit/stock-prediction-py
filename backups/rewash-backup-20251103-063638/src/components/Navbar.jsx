import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simple text logo component
const TextLogo = ({ className = "" }) => {
  return (
    <motion.div 
      className={`font-sans font-bold text-3xl tracking-wide text-white ${className}`}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      Rewash
    </motion.div>
  );
};

const Navbar = () => {
  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <TextLogo />
        </Link>
        
        {/* Rest of your navbar */}
        <div className="flex space-x-4">
          <Link to="/dashboard" className="text-white hover:text-purple-400">Dashboard</Link>
          <Link to="/my-orders" className="text-white hover:text-purple-400">My Orders</Link>
          {/* Other nav links */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;