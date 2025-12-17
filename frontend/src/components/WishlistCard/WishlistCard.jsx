import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AddShoppingCart, DeleteOutline, SentimentDissatisfied } from '@mui/icons-material';

const WishlistCard = ({ product, onAddToCart, onRemove }) => {
    const {
        _id,
        id,
        title,
        name,
        images,
        thumbnail,
        price,
        description = '',
        stock = 0,
        stockStatus = 'out-of-stock'
    } = product;

    const displayId = _id || id;
    const displayName = title || name || 'Unnamed Product';
    const displayImage = thumbnail || (images && images[0]) || '/placeholder.jpg';
    const displayPrice = price ? `₹${price.toFixed(2)}` : 'N/A';
    const isOutOfStock = stock <= 0 || stockStatus === 'out-of-stock';

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
            {/* Image Section */}
            <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
                <Link to={`/products/${displayId}`} className="absolute inset-0 w-full h-full">
                    <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                </Link>
                {/* Bought Overlay */}
                {(product.isBought) && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white z-10 p-4 text-center">
                        <div className="bg-green-500 rounded-full p-2 mb-2 shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="font-bold text-lg">Bought</span>
                        {product.boughtBy && <span className="text-xs opacity-90 mt-1">by {product.boughtBy}</span>}
                    </div>
                )}

                {isOutOfStock && !product.isBought && (
                    <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Out of Stock
                    </div>
                )}

                {/* Quick Action Overlay (Optional Desktop) */}
                <button
                    onClick={() => onRemove(displayId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Remove from wishlist"
                >
                    <DeleteOutline fontSize="small" />
                </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <Link to={`/products/${displayId}`} className="block">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                            {displayName}
                        </h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2 h-10 leading-relaxed">
                        {description}
                    </p>
                    <div className="text-xl font-bold text-gray-900 mb-4">
                        {displayPrice}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto">
                    <button
                        onClick={() => onAddToCart(displayId)}
                        disabled={isOutOfStock}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                        ${isOutOfStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-95'
                            }`}
                    >
                        {isOutOfStock ? (
                            <>
                                <SentimentDissatisfied fontSize="small" />
                                <span>Sold Out</span>
                            </>
                        ) : (
                            <>
                                <AddShoppingCart fontSize="small" />
                                <span>Add to Cart</span>
                            </>
                        )}
                    </button>

                    {/* Mobile Remove Button (visible if hover not supported or just as alternative) */}
                    <div className="md:hidden mt-3 text-center">
                        <button
                            onClick={() => onRemove(displayId)}
                            className="text-gray-400 text-xs font-medium hover:text-red-500 transition-colors"
                        >
                            Remove from list
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

WishlistCard.propTypes = {
    product: PropTypes.object.isRequired,
    onAddToCart: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};

export default WishlistCard;
