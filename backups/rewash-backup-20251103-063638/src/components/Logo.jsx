import React from 'react';

const Logo = ({ size = 40, className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Water Droplet Shape */}
        <path 
          d="M40 8C40 8 24 30 24 48C24 65.7 40 72 40 72C40 72 56 65.7 56 48C56 30 40 8 40 8Z" 
          fill="url(#droplet-gradient)" 
        />
        
        {/* Circular Arrow */}
        <path 
          d="M61.5 48C61.5 59.8741 52.3741 69 40.5 69C28.6259 69 19.5 59.8741 19.5 48C19.5 36.1259 28.6259 27 40.5 27"
          stroke="#8A4FFF" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Arrow Head */}
        <path 
          d="M48 20L40.5 27L33 20" 
          stroke="#8A4FFF" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="droplet-gradient" x1="40" y1="8" x2="40" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8A4FFF" />
            <stop offset="1" stopColor="#6D38D5" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Text part of logo */}
      <div className="ml-2 flex items-center">
        <span className="font-bold text-xl text-purple-500">RE</span>
        <span className="font-medium text-xl text-white">WASH</span>
      </div>
    </div>
  );
};

export default Logo;