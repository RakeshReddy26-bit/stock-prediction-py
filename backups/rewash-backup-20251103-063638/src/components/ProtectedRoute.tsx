import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'wash' | 'iron' | 'dry-clean' | 'repair';
}

interface CartItem extends Product {
  quantity: number;
}

// Success Popup Component
const SuccessPopup = ({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    // @ts-ignore
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 backdrop-blur-sm bg-opacity-90"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl bg-gray-900 text-white shadow-lg border border-purple-900/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transform transition-transform duration-700 ease-in-out"
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        <div className="absolute top-3 left-3 bg-purple-600 text-xs px-2 py-1 rounded-full">
          {product.category}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-3">{product.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-purple-400">₹{product.price}</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(product)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300"
          >
            Add+
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Cart Component
const Cart = ({ isOpen, onClose, items, onRemoveItem }: { isOpen: boolean; onClose: () => void; items: CartItem[]; onRemoveItem: (id: string) => void }) => {
  const subtotal = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
  
  return (
    <>
      {/* Backdrop */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Cart Panel */}
      <motion.div
        className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900/90 backdrop-blur-lg shadow-xl z-50 border-l border-purple-900/30"
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Your Cart</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-center">Your cart is empty</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map(item => (
                  <motion.li 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 border-b border-gray-800 pb-4"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-400">₹{item.price} × {item.quantity}</span>
                        <span className="font-bold text-purple-400">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-800">
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-bold text-white">₹{subtotal}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium"
              >
                Proceed to Checkout
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Cart Toggle Button
const CartButton = ({ itemCount, onClick }: { itemCount: number; onClick: () => void }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white z-30"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      
      {itemCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
        >
          {itemCount}
        </motion.div>
      )}
    </motion.button>
  );
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'user';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-4">
            You don't have the required permissions to access this page.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Main App Component
const App = () => {
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Premium Wash',
      description: 'Deep clean for all fabrics',
      price: 199,
      image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'wash'
    },
    {
      id: '2',
      name: 'Express Ironing',
      description: 'Professional pressing service',
      price: 99,
      image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'iron'
    },
    {
      id: '3',
      name: 'Eco Dry Clean',
      description: 'Gentle cleaning for delicates',
      price: 349,
      image: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'dry-clean'
    },
    {
      id: '4',
      name: 'Stain Removal',
      description: 'Advanced spot treatment',
      price: 149,
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'wash'
    },
    {
      id: '5',
      name: 'Suit Pressing',
      description: 'Premium care for formal wear',
      price: 299,
      image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'iron'
    },
    {
      id: '6',
      name: 'Garment Repair',
      description: 'Fix tears, buttons, and zippers',
      price: 199,
      image: 'https://images.unsplash.com/photo-1677149041061-d30a24004ad9?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3',
      category: 'repair'
    }
  ]);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successPopup, setSuccessPopup] = useState({ show: false, message: '' });

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    
    setSuccessPopup({
      show: true,
      message: `${product.name} added to cart!`
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const closeSuccessPopup = () => {
    setSuccessPopup({ show: false, message: '' });
  };
  
  // Sync cart with local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('rewashCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rewashCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate total items in cart
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Rewash Logo */}
          <div className="mb-6">
            <svg width="180" height="50" viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 10H35.5C43.5 10 47.5 18 41.5 24L35.5 30H26.5M26.5 30L35.5 40M26.5 30H12.5L22.5 40" stroke="white" strokeWidth="4"/>
              <path d="M55.5 10H59.5L70.5 40H65.5L63.5 34H51.5L49.5 40H44.5L55.5 10ZM52.5 30H62.5L57.5 16L52.5 30Z" fill="white"/>
              <path d="M72.5 10H86.5C92.5 10 96.5 14 96.5 20C96.5 26 92.5 30 86.5 30H77.5V40H72.5V10ZM77.5 25H85.5C89.5 25 91.5 23 91.5 20C91.5 17 89.5 15 85.5 15H77.5V25Z" fill="white"/>
              <path d="M116.5 40L103.5 25V40H98.5V10H103.5V25L116.5 10H123.5L107.5 28L123.5 40H116.5Z" fill="white"/>
              <path d="M144.5 10H149.5L160.5 40H155.5L153.5 34H141.5L139.5 40H134.5L144.5 10ZM142.5 30H152.5L147.5 16L142.5 30Z" fill="white"/>
              <path d="M171 40L162 30.6667L158 35.3333V40H153V10H158V29.3333L170 15.3333H176L164 28L177 40H171Z" fill="white"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Future of Clothing Care
          </h1>
          <p className="text-gray-400 max-w-2xl text-center">
            Experience the next dimension of laundry services with our alien technology
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </main>
      
      {/* Cart Button */}
      <CartButton 
        itemCount={cartItemCount} 
        onClick={() => setIsCartOpen(true)} 
      />
      
      {/* Cart Panel */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={removeFromCart}
      />
      
      {/* Success Popup */}
      <SuccessPopup 
        message={successPopup.message}
        isVisible={successPopup.show}
        onClose={closeSuccessPopup}
      />
    </div>
  );
};

export default App;

