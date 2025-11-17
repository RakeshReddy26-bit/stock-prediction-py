import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../data/products';

const Dashboard = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);

  // Add error handling
  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  const handleAddToCart = (product) => {
    setCartItems(prev => [...prev, {...product, quantity: 1}]);
  };

  // Debugging logs
  console.log("All products:", products);
  console.log("Filtered products:", filteredProducts);

  try {
    return (
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Clothing Services</h1>
          <p className="text-gray-400">Browse our laundry and dry cleaning services</p>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar">
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors duration-300 ${
                activeCategory === category.id 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))}
          
          {/* Remove this temporarily for testing */}
          {/* 
          <ProductCard 
            product={{
              id: 'silk-saree-1',
              name: 'Designer Silk Saree',
              description: 'Gentle hand wash & premium care for delicate silk with expert handling',
              price: 599,
              image: '/images/silk-saree.jpg'
            }} 
            onAddToCart={handleAddToCart}
          />
          */}
        </div>
      </div>
    );
  } catch (err) {
    setError(err);
    return null;
  }
};

export default Dashboard;