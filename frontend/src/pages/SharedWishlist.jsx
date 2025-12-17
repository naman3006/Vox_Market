import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../store/api/api';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

const SharedWishlist = () => {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [markModal, setMarkModal] = useState({ show: false, productId: null, productName: '' });
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        fetchSharedWishlist();
    }, [token]);

    const fetchSharedWishlist = async () => {
        try {
            const res = await api.get(`/wishlist/share/${token}`);
            setWishlist(res.data);
        } catch (err) {
            toast.error('List not found or private');
            // navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (productId) => {
        dispatch(addToCart({ productId, quantity: 1 }));
        toast.success('Added to cart!');
    };

    const openMarkModal = (productId, productName) => {
        setMarkModal({ show: true, productId, productName });
    };

    const handleMarkAsBought = async () => {
        if (!guestName.trim()) {
            toast.error('Please enter your name');
            return;
        }

        try {
            const res = await api.post('/wishlist/shared/toggle-bought', {
                shareToken: token,
                productId: markModal.productId,
                boughtBy: guestName
            });
            setWishlist(res.data); // Update list with new status
            toast.success('Item marked as bought!');
            setMarkModal({ show: false, productId: null, productName: '' });
            setGuestName('');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    if (!wishlist) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center p-8 bg-gray-50 rounded-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Oops!</h2>
                <p className="text-gray-600 mt-2">This wishlist doesn't exist or is private.</p>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">Go Home</button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-block p-2 bg-indigo-50 rounded-full mb-4 px-4 text-indigo-700 font-bold text-sm tracking-wide">
                    SHARED WISHLIST
                </div>
                <h1 className="text-4xl font-bold text-gray-900 font-display">{wishlist.name}</h1>
                <p className="text-gray-500 mt-2">Check out this collection!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wishlist.items?.map(item => {
                    const product = item.productId;
                    return (
                        <div key={product._id} className={`bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col relative overflow-hidden ${item.isBought ? 'opacity-75' : ''}`}>

                            {/* Bought Overlay */}
                            {item.isBought && (
                                <div className="absolute top-4 right-4 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    Bought by {item.boughtBy}
                                </div>
                            )}

                            <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{product.title}</h3>
                            <p className="text-indigo-600 font-bold text-xl mb-4">${product.price}</p>

                            <div className="mt-auto space-y-2">
                                <button
                                    onClick={() => handleAddToCart(product._id)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                                >
                                    Add to Cart
                                </button>

                                {!item.isBought ? (
                                    <button
                                        onClick={() => openMarkModal(product._id, product.title)}
                                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all text-sm"
                                    >
                                        Mark as Bought
                                    </button>
                                ) : (
                                    <div className="text-center text-xs text-gray-500 font-medium py-2">
                                        Already bought!
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mark as Bought Modal */}
            {markModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Mark "{markModal.productName}" as Bought</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Let others know you've bought this so they don't buy it again!
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Aunt May"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMarkModal({ show: false, productId: null, productName: '' })}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkAsBought}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                            >
                                Mark as Bought
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedWishlist;
