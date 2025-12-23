import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../store/slices/authSlice';
import api from '../store/api/api';
import { toast } from 'react-toastify';
import SpinWheel from '../components/gamification/SpinWheel';
import DailyStreak from '../components/gamification/DailyStreak';
import Leaderboard from '../components/gamification/Leaderboard';
import { getGamificationProfile } from '../store/slices/gamificationSlice';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import ScratchCard from '../components/gamification/ScratchCard';
import ReferralCard from '../components/gamification/ReferralCard';
import RecentActivity from '../components/gamification/RecentActivity';

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden h-full animate-pulse">
        <div className="h-40 bg-gray-200 w-full relative">
            <div className="absolute top-4 right-4 w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-8 bg-gray-300 rounded"></div>
        </div>
        <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="flex justify-between items-center mt-6">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    </div>
);

const RewardsCenter = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [coupons, setCoupons] = useState([]);
    const [myCoupons, setMyCoupons] = useState([]);
    const [activeTab, setActiveTab] = useState('redeem'); // 'redeem' or 'my-coupons'
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(null);
    const [redeemedCode, setRedeemedCode] = useState(null);

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                fetchRewards(),
                fetchMyCoupons(),
                dispatch(getGamificationProfile())
            ]);
            setLoading(false);
        };
        init();
    }, [dispatch]);

    const fetchRewards = async () => {
        try {
            const res = await api.get('/coupons/active');
            const couponsList = res.data.data || res.data;
            const redeemable = Array.isArray(couponsList) ? couponsList.filter(c => c.costInPoints && c.costInPoints > 0) : [];
            setCoupons(redeemable);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyCoupons = async () => {
        try {
            const res = await api.get('/coupons/my-coupons');
            setMyCoupons(res.data.data || res.data || []);
        } catch (err) {
            console.error(err);
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
            const code = res.data.data?.coupon?.code || res.data.coupon?.code;

            setRedeemedCode({ id: couponId, code: code });
            toast.success('Coupon redeemed successfully!');
            dispatch(getProfile());
            fetchMyCoupons();
            // Optional: Switch to my coupons tab after short delay
            // setTimeout(() => setActiveTab('my-coupons'), 2000);

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

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

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
            <RecentActivity />
            <motion.div variants={itemVariants} className="text-center mb-12">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-display tracking-tight mb-4">
                    Rewards Center
                </h1>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">
                    Turn your shopping into rewards. Play games, earn points, and unlock exclusive discounts.
                </p>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-8 inline-block bg-white/80 backdrop-blur-lg border border-indigo-100 p-1 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
                >
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-6 rounded-[20px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </div>
                        <p className="text-sm uppercase tracking-wider font-bold opacity-90 mb-1">Your Balance</p>
                        <p className="text-5xl font-black tracking-tighter tabular-nums">
                            {user?.loyaltyPoints?.toLocaleString() || 0}
                            <span className="text-2xl font-bold ml-1 opacity-80">pts</span>
                        </p>
                    </div>
                </motion.div>
            </motion.div>


            {/* Gamification Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <motion.div variants={itemVariants} className="lg:col-span-1 h-full flex flex-col gap-8">
                    <DailyStreak />
                    <ScratchCard />
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-1 h-full">
                    <SpinWheel />
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-1 h-full flex flex-col gap-8">
                    <Leaderboard />
                    <ReferralCard />
                </motion.div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('redeem')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'redeem' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    Redeem Points
                </button>
                <button
                    onClick={() => setActiveTab('my-coupons')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'my-coupons' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    My Rewards <span className="ml-2 bg-indigo-500 text-white text-xs py-0.5 px-2 rounded-full">{myCoupons.length}</span>
                </button>
            </div>

            {activeTab === 'redeem' ? (
                <>
                    <motion.h2 variants={itemVariants} className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">🎟️</span>
                        Redeem Coupons
                    </motion.h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        <AnimatePresence>
                            {coupons.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed"
                                >
                                    <p className="text-gray-500 text-lg">No rewards available at the moment. Check back later!</p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {coupons.map(coupon => (
                                        <motion.div
                                            variants={itemVariants}
                                            layout
                                            key={coupon._id}
                                            className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group relative flex flex-col h-full"
                                        >
                                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] opacity-20"></div>
                                                <h3 className="text-4xl font-black text-indigo-900 z-10 tracking-tight">
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                                </h3>
                                                <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm mt-1 z-10">OFF</p>
                                            </div>

                                            <div className="p-6 flex flex-col flex-grow">
                                                <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2" title={coupon.description}>{coupon.description}</h4>
                                                <div className="mt-auto flex items-center justify-between">
                                                    <div className="text-sm font-medium">
                                                        <span className="block text-gray-400 text-xs uppercase">Cost</span>
                                                        <span className="text-indigo-600 font-bold text-lg">{coupon.costInPoints} pts</span>
                                                    </div>

                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleRedeem(coupon._id, coupon.costInPoints)}
                                                        disabled={user?.loyaltyPoints < coupon.costInPoints || redeeming === coupon._id}
                                                        className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${user?.loyaltyPoints >= coupon.costInPoints
                                                            ? 'bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                            }`}
                                                    >
                                                        {redeeming === coupon._id ? 'Processing...' : 'Redeem'}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {myCoupons.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
                            <p className="text-gray-500 text-lg">You haven't redeemed any rewards yet.</p>
                        </div>
                    ) : (
                        myCoupons.map(coupon => (
                            <motion.div
                                key={coupon._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-all"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-indigo-900">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`} OFF
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">{coupon.description}</p>
                                    <p className="text-xs text-gray-400 mt-2">Expires: {new Date(coupon.validUntil).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-lg font-bold text-gray-800 tracking-wider mb-2 select-all">
                                        {coupon.code}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(coupon.code)}
                                        className="text-indigo-600 text-sm font-bold hover:text-indigo-800"
                                    >
                                        Copy Code
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default RewardsCenter;
