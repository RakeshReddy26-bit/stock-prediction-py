import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaPhone, FaUser, FaShoppingCart } from 'react-icons/fa';
import Logo from '../Logo';
import { useCartStore } from '../../store/cartStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { getItemCount } = useCartStore();

  const itemCount = getItemCount();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav 
      className="bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/">
              <Logo size="md" />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <motion.div key={link.path} whileHover={{ y: -2 }}>
                <Link
                  to={link.path}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                      layoutId="navbar-indicator"
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/cart"
                className="relative flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                aria-label={`Shopping cart with ${itemCount} items`}
              >
                <FaShoppingCart className="text-sm" />
                <span>Cart</span>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <FaUser className="text-sm" />
                <span>Login</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/contact"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaPhone className="text-sm" />
                <span>Book Now</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none p-2"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence>
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes className="text-xl" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaBars className="text-xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive(link.path)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="pt-4 space-y-2"
                >
                  <Link
                    to="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <FaShoppingCart className="text-sm" />
                    <span>Cart</span>
                    {itemCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-center"
                  >
                    Book Now
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
