import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLeaderboard } from '../../store/slices/gamificationSlice';

const Leaderboard = () => {
    const dispatch = useDispatch();
    const { leaderboard, loading } = useSelector(state => state.gamification);
    const currentUser = useSelector(state => state.auth.user);

    useEffect(() => {
        dispatch(getLeaderboard());
    }, [dispatch]);

    return (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 z-10">
                <span className="bg-yellow-100 p-2 rounded-xl text-yellow-600">🏆</span>
                Leaderboard
            </h3>

            {loading ? (
                <div className="animate-pulse space-y-4 flex-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl" />)}
                </div>
            ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar z-10">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p className="text-4xl mb-2">🏅</p>
                            <p>No champions yet. Be the first!</p>
                        </div>
                    ) : (
                        leaderboard.map((entry, index) => {
                            const isMe = entry.user._id === currentUser?._id;
                            const isTop3 = index < 3;

                            return (
                                <div
                                    key={entry._id}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all transform hover:scale-[1.02] ${isMe
                                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm'
                                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                                        }`}
                                >
                                    <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-xl text-sm shadow-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white ring-2 ring-yellow-200' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                                                'bg-gray-100 text-gray-500'
                                        }`}>
                                        {index === 0 ? '👑' : `#${index + 1}`}
                                    </div>

                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 p-0.5 border-2 border-white shadow-sm overflow-hidden">
                                            {entry.user.avatar ? (
                                                <img src={entry.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                    {entry.user.name?.[0] || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        {isTop3 && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-[10px] border border-gray-100">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate ${isMe ? 'text-indigo-900' : 'text-gray-800'}`}>
                                            {entry.user.name}
                                        </p>
                                        {isMe && <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">You</span>}
                                    </div>

                                    <div className="text-right bg-white/50 px-3 py-1 rounded-lg">
                                        <p className="font-black text-indigo-600 font-mono">{entry.lifetimePoints.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Pts</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
