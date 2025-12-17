// src/pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import ReviewCard from '../components/ReviewCard/ReviewCard';
import ProductCard from '../components/ProductCard/ProductCard';
import QnASection from '../components/product/QnASection';
import { findOneProduct, findProductRecommendations, selectRecommendations } from '../store/slices/productsSlice';
import { createReview, findReviewsByProduct } from '../store/slices/reviewsSlice';
import { addToWishlist, removeFromWishlist, createWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading } = useSelector((state) => state.products);
  const recommendations = useSelector(selectRecommendations);
  const { reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);
  const { token } = useSelector((state) => state.auth);
  const { items: wishlistItems, wishlists: allWishlists } = useSelector((state) => state.wishlist);
  const inWishlist = wishlistItems?.some((itemId) => itemId === product?._id);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');

  useEffect(() => {
    dispatch(findOneProduct(id));
    dispatch(findReviewsByProduct(id));
    dispatch(findProductRecommendations({ id, limit: 4 }));

  }, [dispatch, id]);

  // Normalize image source: prefer `thumbnail`, then first `images` entry, then placeholder.
  const getImageSrc = () => {
    const srcCandidate = product?.thumbnail || (product?.images && product.images.length ? product.images[0] : null);
    if (!srcCandidate) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect fill='%23f3f4f6' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>No image</text></svg>`;
      return `data:image/svg+xml;utf8,${svg}`;
    }
    let src = srcCandidate;
    // If stored without protocol (relative path like "uploads/.."), ensure it starts with '/'
    if (!/^https?:\/\//i.test(src)) {
      if (!src.startsWith('/')) src = `/${src}`;
    }
    return src;
  };

  // Debug: log product image fields to browser console for inspection
  React.useEffect(() => {
    if (product) {
      // eslint-disable-next-line no-console
      console.debug('Product image fields', {
        id: product._id || product.id,
        thumbnail: product.thumbnail,
        images: product.images,
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    dispatch(addToCart({ productId: id, quantity }));
  };

  const handleWishlistToggle = async (wishlistId, isCurrentlyIn) => {
    if (!token) return;

    // Toggle logic
    if (isCurrentlyIn) {
      await dispatch(removeFromWishlist({ productId: id, wishlistId }));
      // toast.info('Removed from list');
    } else {
      await dispatch(addToWishlist({ productId: id, wishlistId }));
      // toast.success('Added to list');
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newWishlistName.trim()) return;
    const res = await dispatch(createWishlist(newWishlistName)).unwrap();
    // Auto add to the new list
    await dispatch(addToWishlist({ productId: id, wishlistId: res._id }));
    setNewWishlistName('');
    toast.success('List created and item added!');
  };

  const openWishlistModal = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setShowWishlistModal(true);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    dispatch(createReview({ productId: id, comment: reviewText, rating }));
    setReviewText('');
    setRating(5);
  };

  if (loading || reviewsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-gray-500">Product not found</div>;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        <div>
          <img
            src={getImageSrc()}
            alt={product.title}
            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg'; }}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          <p className="text-gray-600 text-lg">{product.description}</p>
          <div className="text-2xl font-semibold text-gray-900">₹{product.price}</div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddToCart}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-semibold"
            >
              Add to Cart
            </button>
            <button
              onClick={openWishlistModal}
              className={`px-6 py-3 rounded-md transition-colors ${inWishlist ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Description & Specifications */}
      <div className="p-8 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Long Description */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Description</h2>
            {product.longDescription ? (
              <div
                className="prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.longDescription }}
              />
            ) : (
              <p className="text-gray-500">No detailed description available.</p>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
            {product.specifications && product.specifications.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-3">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                      <dt className="text-sm font-medium text-gray-600">{spec.key}</dt>
                      <dd className="text-sm font-semibold text-gray-900 text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No specifications listed.</p>
            )}
            {/* Brand and SKU */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Brand</dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right">{product.brand || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">SKU</dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right">{product.sku || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="p-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <div key={rec._id} className="animate-fade-in">
                <ProductCard product={rec} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-8 border-t border-gray-200">
        <QnASection productId={id} />
      </div>

      <div className="p-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>

        <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm font-medium">Rating:</span>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Submit Review
          </button>
        </form>
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review._id || review.id} review={review} />
          ))}
        </div>
      </div>

      {/* Wishlist Selection Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Manage Wishlists</h3>
              <button onClick={() => setShowWishlistModal(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-6 px-1">
              {allWishlists.length === 0 && <p className="text-gray-500 text-center py-4">No wishlists yet.</p>}

              {allWishlists.map(list => {
                const isAlreadyIn = list.items
                  ? list.items.some(item => (item.productId._id || item.productId) === product._id)
                  : list.productIds?.some(p => (typeof p === 'string' ? p : p._id) === product._id);

                const count = list.items ? list.items.length : (list.productIds?.length || 0);

                return (
                  <div
                    key={list._id}
                    className="flex items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleWishlistToggle(list._id, isAlreadyIn)}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isAlreadyIn ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                      {isAlreadyIn && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isAlreadyIn ? 'text-indigo-900' : 'text-gray-700'}`}>{list.name}</p>
                      <p className="text-xs text-gray-400">{count} items</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Create New List</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Birthday)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                />
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newWishlistName.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;