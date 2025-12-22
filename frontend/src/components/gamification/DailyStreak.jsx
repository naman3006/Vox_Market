import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkIn } from '../../store/slices/gamificationSlice';
import { getProfile } from '../../store/slices/authSlice';

const DailyStreak = () => {
    const dispatch = useDispatch();
    const { profile, loading, error } = useSelector(state => state.gamification);
    const user = useSelector(state => state.auth.user);

    const handleCheckIn = async () => {
        await dispatch(checkIn());
        dispatch(getProfile()); // Refresh user points
    };

    // Calculate if checked in today
    const checkedInToday = () => {
        if (!profile?.lastCheckIn) return false;
        const last = new Date(profile.lastCheckIn);
        const now = new Date();
        return last.getDate() === now.getDate() &&
            last.getMonth() === now.getMonth() &&
            last.getFullYear() === now.getFullYear();
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold">Daily Streak</h3>
                        <p className="text-blue-200">Keep up the momentum!</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg text-center min-w-[80px]">
                        <span className="block text-3xl font-bold">{profile?.currentStreak || 0}</span>
                        <span className="text-xs uppercase tracking-wider font-medium">Days</span>
                    </div>
                </div>

                {/* Day Trackers */}
                <div className="flex justify-between mb-8 opacity-90 relative">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/20 -translate-y-1/2 rounded-full -z-0"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-yellow-400 -translate-y-1/2 rounded-full -z-0 transition-all duration-1000" style={{ width: `${Math.min(((profile?.currentStreak || 0) / 7) * 100, 100)}%` }}></div>

                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const isFilled = day <= (profile?.currentStreak % 7) || (profile?.currentStreak > 0 && profile?.currentStreak % 7 === 0);
                        const isTarget = day === 7;

                        return (
                            <div key={day} className="flex flex-col items-center gap-2 relative z-10 group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2 ${isFilled
                                    ? 'bg-yellow-400 border-yellow-400 text-yellow-900 scale-110 shadow-lg shadow-yellow-500/50'
                                    : 'bg-indigo-800/50 border-white/20 text-blue-200'
                                    }`}>
                                    {isFilled ? '✓' : isTarget ? '🎁' : day}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <button
                    onClick={handleCheckIn}
                    disabled={!profile || checkedInToday() || loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${!profile || checkedInToday()
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-white text-indigo-700 hover:bg-gray-50 hover:scale-[1.02] shadow-lg'
                        }`}
                >
                    {checkedInToday() ? (
                        <>
                            <span>Checked In</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </>
                    ) : (
                        !profile ? (
                            error ? 'Retry Load' : 'Loading...'
                        ) : 'Check In Now (+10 Pts)'
                    )}
                </button>

                {profile?.highestStreak > 0 && (
                    <p className="text-center mt-4 text-xs text-blue-200 font-medium tracking-wide">
                        Best Streak: {profile.highestStreak} Days
                    </p>
                )}
            </div>
        </div>
    );
};

export default DailyStreak;
