import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GamificationModal = ({ isOpen, onClose, type = 'success', title, message, rewards, children }) => {
    if (!isOpen) return null;

    const variants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
        exit: { opacity: 0, scale: 0.8 }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return '🎉';
            case 'error': return '⏳'; // Hourglass for wait/limit
            case 'level-up': return '🚀';
            default: return '✨';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden border border-white/50"
                >
                    {/* Background decoration */}
                    <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${type === 'success' ? 'from-green-100' : type === 'error' ? 'from-orange-100' : 'from-indigo-100'} to-transparent -z-10`} />

                    <div className="text-6xl mb-4 animate-bounce-slow">
                        {getIcon()}
                    </div>

                    <h3 className={`text-2xl font-black mb-2 ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-orange-600' : 'text-indigo-900'}`}>
                        {title}
                    </h3>

                    <p className="text-gray-600 mb-6 font-medium">
                        {message}
                    </p>

                    {rewards && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rewards</p>
                            <p className="text-3xl font-black text-indigo-600">{rewards}</p>
                        </div>
                    )}

                    {children}

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                        {type === 'error' ? 'Got it' : 'Awesome!'}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GamificationModal;
