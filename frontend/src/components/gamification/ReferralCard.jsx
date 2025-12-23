import React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const ReferralCard = () => {
    const { user } = useSelector(state => state.auth);
    // Use the explicit referral code from the user profile, fallback to ID slice if absolutely necessary (though backend should always generate one)
    const referralCode = user?.referralCode || (user?._id ? user._id.slice(-6).toUpperCase() : "VOX-MEMBER");

    const copyToClipboard = () => {
        // Use the new, clean logic for the URL, making it dynamic for dev/prod
        const origin = window.location.origin;
        navigator.clipboard.writeText(`${origin}/register?ref=${referralCode}`);
        toast.info('Referral link copied to clipboard!');
    };

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-soft border border-indigo-400/20 relative overflow-hidden h-full flex flex-col justify-between group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <span className="bg-indigo-400/30 text-xs font-bold px-2 py-1 rounded-full border border-indigo-300/30">
                        +500 PTS
                    </span>
                </div>

                <h3 className="text-2xl font-black mb-2">Refer & Earn</h3>
                <p className="text-indigo-100 text-sm mb-6">Invite friends to VoxMarket. You both get 500 points when they sign up!</p>

                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-1.5 flex items-center justify-between border border-white/10">
                    <code className="font-mono text-lg font-bold tracking-wider px-3">{referralCode}</code>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-xs shadow-lg uppercase tracking-wider hover:bg-gray-50"
                    >
                        Copy
                    </motion.button>
                </div>
            </div>

            <div className="mt-8 relative z-10 flex items-center gap-3 opacity-80">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-300 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            ?
                        </div>
                    ))}
                </div>
                <span className="text-xs font-medium">Waiting for joins...</span>
            </div>
        </div>
    );
};

export default ReferralCard;
