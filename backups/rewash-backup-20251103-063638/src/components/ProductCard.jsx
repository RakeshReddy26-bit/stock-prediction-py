import React, { useState } from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // IMPORTANT: Force a direct test image for every card
  const testImage = "https://picsum.photos/400/400?random=" + product.id;
  
  // Log product details to console for debugging
  console.log("Product in card:", product); 

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-gray-900 text-white shadow-lg border border-purple-900/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with clear debug styling */}
      <div className="relative" style={{ 
        height: '250px',
        width: '100%',
        backgroundColor: '#555',
        backgroundImage: `url(${testImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '3px solid lime'
      }}>
        <div className="absolute top-3 left-3 bg-purple-600 text-xs px-2 py-1 rounded-full">
          {product.category}
        </div>
      </div>
      
      {/* Product info */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-3">{product.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-purple-400">₹{product.price}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center justify-center transition-all duration-300"
          >
            Add+
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;