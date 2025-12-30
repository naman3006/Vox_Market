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
import SocialProofBadge from '../components/common/SocialProofBadge';
import { getOptimizedImageUrl } from '../utils/urlUtils';

// Lazy load ARViewer to avoid bundling @google/model-viewer in the main chunk
const ARViewer = React.lazy(() => import('../components/product/ARViewer'));

import { motion, AnimatePresence } from 'framer-motion';

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

  const getImageSrc = () => {
    const srcCandidate = product?.thumbnail || (product?.images && product.images.length ? product.images[0] : null);
    if (!srcCandidate) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect fill='%23f3f4f6' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>No image</text></svg>`;
      return `data:image/svg+xml;utf8,${svg}`;
    }
    return getOptimizedImageUrl(srcCandidate);
  };

  const handleAddToCart = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    dispatch(addToCart({ productId: id, quantity }));
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = async (wishlistId, isCurrentlyIn) => {
    if (!token) return;
    if (isCurrentlyIn) {
      await dispatch(removeFromWishlist({ productId: id, wishlistId }));
    } else {
      await dispatch(addToWishlist({ productId: id, wishlistId }));
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newWishlistName.trim()) return;
    const res = await dispatch(createWishlist(newWishlistName)).unwrap();
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
      <div className="flex justify-center items-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"
        />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-gray-500 py-20">Product not found</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-white shadow-sm rounded-3xl overflow-hidden mb-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 lg:p-12">
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              src={getImageSrc()}
              alt={product.title}
              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.svg'; }}
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
          </div>

          {product.arModelUrl && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="mt-6 border border-indigo-50 bg-indigo-50/50 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                </span>
                <h3 className="text-lg font-bold text-gray-900">Augmented Reality Experience</h3>
              </div>
              <React.Suspense fallback={<div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">Loading 3D View...</div>}>
                <ARViewer
                  src={product.arModelUrl}
                  poster={getImageSrc()}
                  placement={product.arPlacement}
                  alt={product.title}
                />
              </React.Suspense>
            </motion.div>
          )}
        </motion.div>

        <div className="space-y-8">
          <motion.div variants={itemVariants}>
            <SocialProofBadge productId={product._id} />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-4 tracking-tight leading-tight">{product.title}</h1>
            <p className="text-gray-500 text-lg mt-4 leading-relaxed max-w-2xl">{product.description}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-end gap-4 border-b border-gray-100 pb-8">
            <span className="text-4xl font-bold text-gray-900 font-display">₹{product.price}</span>
            {product.discount > 0 && (
              <span className="text-red-500 font-medium mb-1.5 px-2 py-0.5 bg-red-50 rounded-md text-sm">
                Save {product.discount}%
              </span>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center border border-gray-200 rounded-xl p-1 w-max">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
              >-</button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center border-none focus:ring-0 font-bold text-gray-900 bg-transparent"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
              >+</button>
            </div>

            <div className="flex gap-3 flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="flex-1 bg-gray-900 text-white px-8 py-3.5 rounded-xl hover:bg-black transition-colors font-bold text-lg shadow-xl shadow-gray-200"
              >
                Add to Cart
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={openWishlistModal}
                className={`px-4 py-3.5 rounded-xl transition-all border ${inWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${inWishlist ? 'fill-current' : 'none'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-8 grid grid-cols-2 gap-4">
            {[
              { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", text: "Free Shipping" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "2 Year Warranty" }
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feat.icon} /></svg>
                </div>
                <span className="font-medium text-gray-900 sm:text-sm">{feat.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Details & Specs */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-3 gap-12 p-8 lg:p-12 border-t border-gray-100">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Description</h2>
          {product.longDescription ? (
            <div
              className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.longDescription }}
            />
          ) : (
            <p className="text-gray-500 italic">No detailed description available.</p>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <dl className="space-y-4">
              {product.specifications?.map((spec, index) => (
                <div key={index} className="flex justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                  <dt className="text-sm font-medium text-gray-500">{spec.key}</dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right">{spec.value}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <dt className="text-sm font-medium text-gray-500">Brand</dt>
                <dd className="text-sm font-semibold text-gray-900 text-right">{product.brand || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                <dd className="text-sm font-semibold text-gray-900 text-right">{product.sku || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </motion.div>

      {/* Recommendations & QnA & Reviews omitted for brevity but should be wrapped similarly if needed */}
      {recommendations && recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-8 lg:p-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <motion.div key={rec._id} whileHover={{ y: -5 }} className="h-full">
                <ProductCard product={rec} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="p-8 lg:p-12 border-t border-gray-100 bg-gray-50/50">
        <QnASection productId={id} />
      </div>

      <div className="p-8 lg:p-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h2>
        <form onSubmit={handleSubmitReview} className="mb-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setRating(star)} className="text-2xl transition-transform hover:scale-110 focus:outline-none">
                <span className={rating >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you like or dislike?"
            className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-gray-900 placeholder-gray-400"
            rows="3"
          />
          <button type="submit" className="mt-4 px-6 py-2 bg-gray-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-colors">Submit Review</button>
        </form>
        <div className="grid gap-6">
          {reviews.map(review => <ReviewCard key={review._id || review.id} review={review} />)}
        </div>
      </div>

      <AnimatePresence>
        {showWishlistModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Manage Wishlists</h3>
                <button onClick={() => setShowWishlistModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {allWishlists.length === 0 && <p className="text-center text-gray-400 py-4">No wishlists created yet.</p>}
                {allWishlists.map(list => {
                  const isAlreadyIn = list.items ? list.items.some(item => (item.productId._id || item.productId) === product._id) : list.productIds?.some(p => (typeof p === 'string' ? p : p._id) === product._id);
                  return (
                    <div key={list._id} onClick={() => handleWishlistToggle(list._id, isAlreadyIn)} className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${isAlreadyIn ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mr-3 transition-colors ${isAlreadyIn ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>
                        {isAlreadyIn && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`font-semibold ${isAlreadyIn ? 'text-indigo-900' : 'text-gray-700'}`}>{list.name}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="New list name" className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100" value={newWishlistName} onChange={(e) => setNewWishlistName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()} />
                <button onClick={handleCreateAndAdd} disabled={!newWishlistName.trim()} className="px-5 py-2 bg-black text-white rounded-xl font-bold text-sm disabled:opacity-50">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductDetail;