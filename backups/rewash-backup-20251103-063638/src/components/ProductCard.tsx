import React from 'react';

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
  };
  addToCart: (product: any) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <img src={product.image} className="rounded-xl mb-2 w-full h-40 object-cover" />
      <h2 className="text-lg font-semibold">{product.name}</h2>
      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
      <button
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
        onClick={() => addToCart(product)}
      >
        Add+
      </button>
    </div>
  );
};

export default ProductCard;

// If it's in src/pages/ProductCard.tsx
// import ProductCard from '../pages/ProductCard';

// If it's in src/components/products/ProductCard.tsx
// import ProductCard from './products/ProductCard';

// If it's in src/shared/ProductCard.tsx
// import ProductCard from '../shared/ProductCard';