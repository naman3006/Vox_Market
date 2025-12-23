import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { getRecentActivities } from '../../store/slices/gamificationSlice';

const RecentActivity = () => {
    const dispatch = useDispatch();
    const { recentActivities } = useSelector(state => state.gamification);

    useEffect(() => {
        dispatch(getRecentActivities());
        // Poll every 30 seconds to keep it "live"
        const interval = setInterval(() => {
            dispatch(getRecentActivities());
        }, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Fallback mock data if no real activities yet
    const mockActivities = [
        { user: 'Alex M.', action: 'won', reward: '50 Points', time: '2m ago' },
        { user: 'Sarah K.', action: 'redeemed', reward: '10% OFF', time: '5m ago' },
        { user: 'John D.', action: 'reached', reward: 'Silver Tier', time: '12m ago' },
        { user: 'Emma W.', action: 'won', reward: '20 Points', time: '15m ago' },
        { user: 'Mike R.', action: 'scratched', reward: '100 Points', time: '22m ago' },
    ];

    const activitiesToDisplay = recentActivities && recentActivities.length > 0
        ? recentActivities
        : mockActivities;

    // Duplicate list for infinite scroll effect
    const carouselItems = [...activitiesToDisplay, ...activitiesToDisplay, ...activitiesToDisplay];

    return (
        <div className="bg-white border-b border-gray-100 py-2 overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-4 max-w-7xl mx-auto">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider whitespace-nowrap bg-indigo-50 px-2 py-1 rounded">
                    Live Feed
                </span>
                <div className="flex-1 overflow-hidden relative h-6">
                    <motion.div
                        className="flex gap-8 absolute whitespace-nowrap"
                        animate={{ x: [0, -1000] }}
                        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                    >
                        {carouselItems.map((activity, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-bold text-gray-800">{activity.user}</span>
                                <span>{activity.action}</span>
                                <span className="font-bold text-indigo-600">{activity.reward}</span>
                                <span className="text-xs text-gray-400">
                                    {/* Handle both relative string (mock) and ISO date (real) */}
                                    {activity.time.includes && activity.time.includes('ago')
                                        ? `(${activity.time})`
                                        : `(${new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                                    }
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RecentActivity;
