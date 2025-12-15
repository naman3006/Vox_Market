import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../store/slices/authSlice';
import api from '../store/api/api';
import { toast } from 'react-toastify';

const RewardsCenter = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(null);
    const [redeemedCode, setRedeemedCode] = useState(null); // Track recently redeemed code to show user

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            // Fetch all active coupons
            // In a real app, we might ask backend for "redeemable" specifically
            const res = await api.get('/coupons/active');
            // Filter for those with point cost
            const couponsList = res.data.data || res.data; // Handle potential wrapper differences
            const redeemable = Array.isArray(couponsList) ? couponsList.filter(c => c.costInPoints && c.costInPoints > 0) : [];
            setCoupons(redeemable);
        } catch (err) {
            toast.error('Failed to load rewards');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (couponId, cost) => {
        if (user.loyaltyPoints < cost) {
            toast.error('Not enough points!');
            return;
        }

        if (!window.confirm(`Redeem this coupon for ${cost} points?`)) return;

        setRedeeming(couponId);
        try {
            const res = await api.post(`/loyalty/redeem/${couponId}`);
            // Assuming response contains { user, coupon }
            const code = res.data.data?.coupon?.code || res.data.coupon?.code;

            setRedeemedCode({ id: couponId, code: code });
            toast.success('Coupon redeemed successfully!');
            dispatch(getProfile()); // Refresh points
        } catch (err) {
            toast.error(err.response?.data?.message || 'Redemption failed');
        } finally {
            setRedeeming(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info('Copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 font-display">Rewards Center</h1>
                <p className="text-gray-500 mt-2 text-lg">Redeem your hard-earned points for exclusive discounts.</p>

                <div className="mt-8 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg">
                    <p className="text-sm uppercase tracking-wider font-bold opacity-80">Your Balance</p>
                    <p className="text-4xl font-bold mt-1">{user?.loyaltyPoints || 0} pts</p>
                </div>
            </div>

            {coupons.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-gray-500 text-lg">No rewards available at the moment. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {coupons.map(coupon => (
                        <div key={coupon._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-all group relative">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                </div>
                                <h3 className="text-3xl font-bold text-indigo-900 z-10">
                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}
                                </h3>
                                <p className="text-indigo-600 font-medium mt-1 z-10">{coupon.code}</p>
                            </div>

                            <div className="p-6">
                                <h4 className="font-bold text-gray-900 mb-2 line-clamp-1" title={coupon.description}>{coupon.description}</h4>
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-500 font-medium">
                                        Cost: <span className="text-indigo-600 font-bold">{coupon.costInPoints} pts</span>
                                    </div>

                                    {redeemedCode?.id === coupon._id ? (
                                        <button
                                            onClick={() => copyToClipboard(redeemedCode.code)}
                                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm hover:bg-green-200 transition-all flex items-center gap-2 animate-fade-in"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                            Copy: {redeemedCode.code}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRedeem(coupon._id, coupon.costInPoints)}
                                            disabled={user?.loyaltyPoints < coupon.costInPoints || redeeming === coupon._id}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${user?.loyaltyPoints >= coupon.costInPoints
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {redeeming === coupon._id ? 'Redeeming...' : 'Redeem'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RewardsCenter;
