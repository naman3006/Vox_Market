import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { spinWheel, clearSpinResult, getGamificationProfile } from '../../store/slices/gamificationSlice';
import { getProfile } from '../../store/slices/authSlice';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import GamificationModal from './GamificationModal';

const SpinWheel = () => {
    const dispatch = useDispatch();
    const { profile, loading, spinResult, error: apiError } = useSelector(state => state.gamification);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow - now;
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(timer);
    }, []);

    const rewards = [
        { label: '50 Points', color: '#8b5cf6' },
        { label: '20 Points', color: '#ec4899' },
        { label: '10 Points', color: '#3b82f6' },
        { label: '5 Points', color: '#10b981' },
        { label: 'Try Again', color: '#6b7280' },
    ];

    const canSpin = () => {
        if (!profile) return false;
        if (!profile.lastSpinDate) return true;

        const lastSpin = new Date(profile.lastSpinDate);
        const now = new Date();

        // precise check: if same day, month, year -> cannot spin
        const isSameDay = lastSpin.getDate() === now.getDate() &&
            lastSpin.getMonth() === now.getMonth() &&
            lastSpin.getFullYear() === now.getFullYear();

        return !isSameDay;
    };

    const [modalState, setModalState] = useState({ isOpen: false, type: 'success', title: '', message: '', rewards: null });

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleSpin = async () => {
        if (isSpinning || !canSpin()) {
            if (!canSpin()) {
                setModalState({
                    isOpen: true,
                    type: 'error',
                    title: 'Come Back Tomorrow',
                    message: 'You have already used your daily spin. Please wait for the cooldown.',
                    rewards: null
                });
            }
            return;
        }

        setIsSpinning(true);
        dispatch(clearSpinResult());

        try {
            // Use unwrap() to handle success/failure explicitly
            const payload = await dispatch(spinWheel()).unwrap();
            const result = payload.result;

            if (result) {
                const index = rewards.findIndex(r => r.label === result.label);

                // Fallback if label mismatch (shouldn't happen but safe)
                const safeIndex = index === -1 ? 0 : index;

                const segmentAngle = 360 / rewards.length;

                // Calculate target angle (additive to current rotation to prevent jumping)
                // We want to rotate AT LEAST 5 times (1800 deg)
                // The landing position is relative to the circle.
                // NOTE: Wheel rotates, but the pointer is at the TOP (0 deg visually, but usually -90 offset in SVG).
                // Our SVG is -90 rotated inside the container div.
                // Let's stick to the previous simple logic but make it robust.

                // Calculation:
                // Full spins + offset to land on the segment.
                // Segment 0 is at 0-72 deg.
                // To land on Segment 0 with pointer at top, we need to rotate such that Segment 0 is at top.
                // 360 - center_of_segment_angle?

                const newRotation = rotation + 1800 + (360 - (safeIndex * segmentAngle)) - (segmentAngle / 2);

                setRotation(newRotation);

                setTimeout(() => {
                    setIsSpinning(false);
                    dispatch(getProfile());

                    // Show confetti if won
                    if (result.value > 0) {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: [rewards[safeIndex].color, '#ffffff']
                        });
                        // SUCCESS MODAL
                        setModalState({
                            isOpen: true,
                            type: 'success',
                            title: 'Congratulations!',
                            message: `You won ${result.label} on the daily spin!`,
                            rewards: `${result.value} Points`
                        });
                    } else {
                        // TRY AGAIN MODAL
                        setModalState({
                            isOpen: true,
                            type: 'info',
                            title: 'So Close!',
                            message: 'Better luck next time. Come back tomorrow for another free spin!',
                            rewards: null
                        });
                    }
                }, 4000);
            }
        } catch (error) {
            console.error("Spin failed:", error);
            const errMsg = typeof error === 'string' ? error : "Spin failed. Please try again.";

            if (errMsg.includes('Already spin')) {
                setModalState({
                    isOpen: true,
                    type: 'error',
                    title: 'Limit Reached',
                    message: 'You have already used your free spin for today.',
                    rewards: null
                });
            } else {
                toast.error(errMsg);
            }
            setIsSpinning(false);
        }
    };

    const isAlreadySpunError = apiError === 'Already spin today!';
    const spinAvailable = canSpin();
    // Show spun state if technically they can't spin OR if the API explicitly told us so
    const showSpunState = !spinAvailable || isAlreadySpunError;

    return (
        <>
            <GamificationModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                rewards={modalState.rewards}
            >
                {/* Optional children like countdown could go here if checking logic allowed passing it */}
            </GamificationModal>

            <div className={`flex flex-col items-center p-8 bg-white rounded-3xl shadow-soft border border-gray-100 h-full justify-between relative overflow-hidden group transition-all duration-500 ${showSpunState ? 'grayscale-[0.8] opacity-90' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <h3 className="text-2xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
                    Daily Spin & Win
                </h3>

                <div className="relative mb-10 transform transition-transform hover:scale-105 duration-300">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 z-20 w-12 h-12 filter drop-shadow-xl">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-900">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>

                    <div className="relative p-2 rounded-full bg-gradient-to-b from-gray-100 to-white shadow-xl border border-gray-100">
                        <div
                            className="w-64 h-64 rounded-full border-8 border-white shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.2,0,0,1)]"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 scale-105">
                                {rewards.map((reward, i) => {
                                    const startAngle = i * (360 / rewards.length);
                                    const endAngle = (i + 1) * (360 / rewards.length);
                                    const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                                    const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                                    const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                                    const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                                    const d = `M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`;

                                    return (
                                        <path key={i} d={d} fill={reward.color} stroke="white" strokeWidth="2" />
                                    );
                                })}
                            </svg>

                            {rewards.map((reward, i) => {
                                const angle = i * (360 / rewards.length) + (360 / rewards.length) / 2;
                                return (
                                    <div
                                        key={i}
                                        className="absolute w-full h-full flex justify-center pt-6 pointer-events-none"
                                        style={{ transform: `rotate(${angle}deg)` }}
                                    >
                                        <span className="text-white font-black text-[10px] uppercase tracking-wider drop-shadow-md transform -rotate-90 origin-bottom pb-12 w-20 text-center leading-tight">
                                            {reward.label}
                                        </span>
                                    </div>
                                );
                            })}

                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-50 z-10">
                                <span className="text-xl">🎰</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center gap-4">
                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || !profile || showSpunState || loading}
                        className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-95 ${isSpinning || !profile || showSpunState
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200'
                            }`}
                    >
                        {!profile ? (
                            apiError && !isAlreadySpunError ? 'Retry' : 'Loading...'
                        ) : isSpinning ? 'Good Luck...' : showSpunState ? 'Come Back Tomorrow' : 'SPIN & WIN'}
                    </button>

                    {showSpunState && !isSpinning && (
                        <div className="flex flex-col items-center animate-fade-in bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 w-full">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                                Next Spin In
                            </p>
                            <p className="text-xl font-mono font-bold text-indigo-700">
                                {timeLeft}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SpinWheel;
