import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const steps = [
    { id: 'pending', label: 'Order Placed', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'confirmed', label: 'Confirmed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'processing', label: 'Processing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { id: 'shipped', label: 'Shipped', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'delivered', label: 'Delivered', icon: 'M5 13l4 4L19 7' },
];

const OrderTimeline = ({ status, history = [] }) => {
    const currentStepIndex = steps.findIndex(step => step.id === status);
    const isCancelled = status === 'cancelled';
    const isReturned = status === 'returned';

    // Helper to find the specific history entry for a step
    const getStepDate = (stepId) => {
        const entry = history.slice().reverse().find(h => h.status === stepId);
        return entry ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : null;
    };

    if (isCancelled) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8 text-center shadow-sm"
            >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h3 className="text-xl font-bold text-red-700">Order Cancelled</h3>
                <p className="text-red-500 text-sm mt-1">
                    {getStepDate('cancelled') || 'This order has been cancelled.'}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="w-full py-8 px-2 overflow-x-auto">
            <div className="relative flex items-center justify-between min-w-[600px] md:min-w-0">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>

                {/* Active Progress Line */}
                <motion.div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-green-400 to-green-600 -z-10 rounded-full box-shadow-glow"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                ></motion.div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const date = getStepDate(step.id);

                    return (
                        <div key={step.id} className="flex flex-col items-center group relative w-full first:items-start last:items-end">
                            {/* Centering wrapper for middle items */}
                            <div className={`flex flex-col items-center ${index === 0 ? 'items-start' : index === steps.length - 1 ? 'items-end' : 'items-center'} w-full`}>

                                {/* Icon Circle */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                                        ${isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-green-600 border-white shadow-lg shadow-green-200 text-white'
                                            : 'bg-white border-gray-100 text-gray-300 shadow-sm'
                                        }
                                        ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                                    `}
                                >
                                    {isCurrent && (
                                        <motion.span
                                            className="absolute inset-0 rounded-full bg-green-400 opacity-20"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                    )}
                                    <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                                    </svg>
                                </motion.div>

                                {/* Texts */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 + 0.2 }}
                                    className={`absolute top-16 flex flex-col ${index === 0 ? 'items-start text-left' : index === steps.length - 1 ? 'items-end text-right' : 'items-center text-center'} w-32`}
                                >
                                    <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                    {date && (
                                        <span className="text-[10px] text-gray-500 font-medium mt-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 whitespace-nowrap">
                                            {date}
                                        </span>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Added spacing container for the absolute text below */}
            <div className="h-16"></div>
        </div>
    );
};

export default OrderTimeline;
