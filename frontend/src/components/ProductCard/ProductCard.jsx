/* eslint-disable react-hooks/rules-of-hooks */
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import OptimizedImage from '../common/OptimizedImage';

const ProductCard = memo(({ product }) => {
  // Validate product data
  if (!product || !product._id) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
        <div className="text-center text-gray-500">
          <p>Invalid product data</p>
        </div>
      </div>
    );
  }

  // Memoize derived data to prevent unnecessary recalculations
  const displayData = useMemo(() => {
    return {
      id: product._id || product.id,
      name: product.title || product.name || 'Unnamed Product',
      image: product.image || product.images?.[0] || '/placeholder.jpg',
      price: product.price ? `₹${product.price.toFixed(2)}` : 'N/A',
      description: (product.description || '').substring(0, 100),
      rating: product.rating || 0,
      stock: product.stock || 0,
      stockStatus: product.stockStatus || 'out-of-stock',
    };
  }, [product]);

  return (
    <Link
      to={`/products/${displayData.id}`}
      className="group block h-full w-full transform transition-all duration-300 hover:-translate-y-1"
      aria-label={`View ${displayData.name}`}
    >
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden h-full flex flex-col transition-shadow duration-300 hover:shadow-glow border border-gray-100 relative">
        {/* Image Container */}
        <div className="relative w-full pt-[100%] overflow-hidden bg-gray-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <OptimizedImage
              src={displayData.image}
              alt={displayData.name}
              className="w-full h-full"
            />

          </div>

          {/* Overlay Gradient (Subtle) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.discount && (
              <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                -{product.discount}% OFF
              </span>
            )}
            {displayData.stockStatus === 'out-of-stock' && (
              <span className="bg-gray-800/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Content Container */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="mb-2">
            {displayData.rating > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-xs font-medium text-gray-500">{displayData.rating.toFixed(1)}</span>
              </div>
            )}
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 font-display text-lg leading-tight group-hover:text-primary-600 transition-colors">
              {displayData.name}
            </h3>
          </div>

          {displayData.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-body leading-relaxed">
              {displayData.description}
            </p>
          )}

          {/* Footer: Price & Action */}
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Price</span>
              <span className="text-lg font-bold text-gray-900">{displayData.price}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.number,
    description: PropTypes.string,
    rating: PropTypes.number,
    stock: PropTypes.number,
    stockStatus: PropTypes.string,
    discount: PropTypes.number,
  }),
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;