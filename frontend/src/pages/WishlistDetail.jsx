import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../store/api/api';
import { toast } from 'react-toastify';
import WishlistCard from '../components/WishlistCard/WishlistCard';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import {
    Lock,
    Public,
    Share,
    ArrowBack,
    ShoppingBag
} from '@mui/icons-material';

// Simple Skeleton Component
const ProductSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse h-full flex flex-col">
        <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
        <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
        </div>
    </div>
);

const WishlistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [wishlist, setWishlist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, [id]);

    const fetchWishlist = async () => {
        try {
            const res = await api.get(`/wishlist/${id}`);
            setWishlist(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load wishlist');
            navigate('/wishlists');
        } finally {
            setLoading(false);
        }
    };

    const handlePrivacyToggle = async () => {
        const newPrivacy = wishlist.privacy === 'private' ? 'public' : 'private';
        try {
            const res = await api.patch(`/wishlist/${id}/privacy`, { privacy: newPrivacy });
            setWishlist(res.data.data);
            toast.success(`Wishlist is now ${newPrivacy}`);
        } catch (err) {
            toast.error('Failed to update privacy');
        }
    };

    const handleShare = () => {
        if (wishlist?.privacy === 'private') {
            toast.warn('Make the list public first to share!');
            return;
        }
        const url = `${window.location.origin}/wishlist/share/${wishlist.shareToken}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied! Share it with friends.');
    };

    const handleRemove = async (productId) => {
        try {
            await api.delete(`/wishlist/remove/${productId}`, { data: { wishlistId: id } });
            fetchWishlist();
            toast.info('Item removed from list');
        } catch (err) {
            toast.error('Failed to remove item');
        }
    };

    const handleAddToCart = (productId) => {
        dispatch(addToCart({ productId, quantity: 1 }));
        toast.success("Added to cart");
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="h-8 w-32 bg-gray-200 rounded mb-8 animate-pulse"></div>
                <div className="h-32 w-full bg-gray-200 rounded-2xl mb-8 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (!wishlist) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50/50 min-h-screen">
            {/* Header / Nav */}
            <div className="mb-8">
                <Link
                    to="/wishlists"
                    className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium mb-4 group"
                >
                    <ArrowBack className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to My Lists
                </Link>

                <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                                {wishlist.name}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                    {wishlist.items?.length || 0} ITEMS
                                </span>
                                <span className="flex items-center gap-1.5">
                                    {wishlist.privacy === 'private' ? (
                                        <Lock fontSize="small" />
                                    ) : (
                                        <Public fontSize="small" />
                                    )}
                                    {wishlist.privacy === 'private' ? 'Private List' : 'Public List'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handlePrivacyToggle}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border
                                    ${wishlist.privacy === 'private'
                                        ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                                    }`}
                            >
                                {wishlist.privacy === 'private' ? (
                                    <>
                                        <Public fontSize="small" />
                                        Make Public
                                    </>
                                ) : (
                                    <>
                                        <Lock fontSize="small" />
                                        Make Private
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleShare}
                                disabled={wishlist.privacy === 'private'}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm
                                    ${wishlist.privacy === 'private'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                                        : 'bg-black text-white hover:bg-gray-800 hover:shadow-md'
                                    }`}
                            >
                                <Share fontSize="small" />
                                Share List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlist.items?.map(item => (
                    <WishlistCard
                        key={item.productId._id}
                        product={{ ...item.productId, isBought: item.isBought, boughtBy: item.boughtBy }}
                        onRemove={() => handleRemove(item.productId._id)}
                        onAddToCart={() => handleAddToCart(item.productId._id)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {(!wishlist.items || wishlist.items.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="p-4 bg-blue-50 rounded-full mb-4">
                        <ShoppingBag fontSize="large" className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Your list is empty</h3>
                    <p className="text-gray-500 max-w-md text-center mb-8">
                        Looks like you haven't saved any items yet. Start exploring and save your favorites here!
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Browse Products
                    </button>
                </div>
            )}
        </div>
    );
};

export default WishlistDetail;
