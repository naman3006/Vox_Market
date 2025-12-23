import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserActivities } from '../../store/slices/activityLogSlice';
import { motion } from 'framer-motion';

const UserActivityLog = () => {
    const dispatch = useDispatch();
    const { activities, loading, error } = useSelector(state => state.activityLog);

    useEffect(() => {
        dispatch(getUserActivities());
    }, [dispatch]);

    if (loading && activities.length === 0) {
        return <div className="p-4 text-center text-gray-500">Loading activities...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
                <p>No recent activity logged.</p>
            </div>
        );
    }

    const getActivityIcon = (action) => {
        switch (action) {
            case 'LOGIN': return '🔐';
            case 'LOGOUT': return '👋';
            case 'REGISTER': return '👋';
            case 'ORDER_PLACED': return '🛍️';
            case 'PROFILE_UPDATE': return '👤';
            case '2FA_ENABLED': return '🛡️';
            case '2FA_DISABLED': return '⚠️';
            case 'WISHLIST_ADD': return '❤️';
            case 'WISHLIST_REMOVE': return '💔';
            default: return '📝';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">📜</span>
                Activity Log
            </h3>

            <div className="space-y-6 relative ml-2 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {activities.map((activity, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={activity._id}
                        className="relative pl-8"
                    >
                        <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-indigo-100 rounded-full flex items-center justify-center text-xs shadow-sm z-10">
                            {getActivityIcon(activity.action)}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 hover:bg-indigo-50 transition-colors border border-gray-100">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">
                                        {activity.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">
                                            {activity.action}
                                        </span>
                                        {activity.ipAddress && (
                                            <span className="text-[10px] text-gray-400 font-mono bg-white px-2 py-0.5 rounded border border-gray-100">
                                                IP: {activity.ipAddress}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(activity.createdAt).toLocaleDateString()}
                                    <br />
                                    <span className="text-[10px]">
                                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {activities.length >= 50 && (
                <div className="mt-4 text-center">
                    <span className="text-xs text-gray-400 italic">Showing last 50 activities</span>
                </div>
            )}
        </div>
    );
};

export default UserActivityLog;
