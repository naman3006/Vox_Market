import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { scratchCard, clearScratchResult, getGamificationProfile } from '../../store/slices/gamificationSlice';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const ScratchCard = () => {
    const dispatch = useDispatch();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const { profile, loading, scratchResult, error } = useSelector(state => state.gamification);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isReadyToScratch, setIsReadyToScratch] = useState(false);
    const [scratchPercentage, setScratchPercentage] = useState(0);

    // Initial setup or reset
    useEffect(() => {
        if (canvasRef.current && containerRef.current) {
            initCanvas();
        }
    }, [isReadyToScratch]);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Set canvas size to match container
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        // Fill with silver overlay
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.fillRect(0, 0, width, height);

        // Add some "texture" or text
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#909090';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch Here!', width / 2, height / 2);

        // Pattern
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            ctx.fill();
        }
    };

    const handleStart = async () => {
        if (!canScratch()) {
            // Double protection: UI should hide button, but if forced, show toast
            // error toast is handled by parent, but let's be UI friendly
            return;
        }

        if (canScratch()) {
            dispatch(clearScratchResult());
            try {
                await dispatch(scratchCard()).unwrap();
                setIsReadyToScratch(true);
            } catch (err) {
                // Error handled by UI
            }
        }
    };

    const handleScratch = (e) => {
        if (!isReadyToScratch || isRevealed) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Calculate percentage (throttle this in production, but okay for now)
        // Doing it every frame is expensive, let's do it simply by counting "moves" or just visual
        // For accurate percentage: getImageData (expensive). 
        // Let's use a counter or just checking every few moves.

        checkScratchPercentage();
    };

    const checkScratchPercentage = () => {
        if (Math.random() > 0.1) return; // Only check 10% of the time to save perf

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearedPixels = 0;
        const totalPixels = imageData.data.length / 4;

        for (let i = 0; i < totalPixels; i++) {
            if (imageData.data[i * 4 + 3] === 0) { // Alpha channel is 0
                clearedPixels++;
            }
        }

        const percentage = (clearedPixels / totalPixels) * 100;
        setScratchPercentage(percentage);

        if (percentage > 40 && !isRevealed) { // Reveal at 40%
            setIsRevealed(true);
            canvas.style.opacity = 0;
            handleWin();
        }
    };

    const handleWin = () => {
        dispatch(getGamificationProfile());
        if (scratchResult?.value > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500']
            });
        }
    };

    const canScratch = () => {
        if (!profile?.lastScratchDate) return true;
        const last = new Date(profile.lastScratchDate);
        const now = new Date();
        return !(last.getDate() === now.getDate() &&
            last.getMonth() === now.getMonth() &&
            last.getFullYear() === now.getFullYear());
    };

    // Check if already scratched today to show "Tomorrow" state
    const isAlreadyScratchedError = error === 'Already scratched today!';
    const isAlreadyScratched = !canScratch() || isAlreadyScratchedError;

    return (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 flex flex-col items-center justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-bl-full -mr-16 -mt-16 z-0 opacity-50"></div>

            <h3 className="text-2xl font-black mb-6 text-gray-900 z-10">Lucky Scratch</h3>

            <div
                ref={containerRef}
                className="relative w-64 h-40 bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center select-none"
            >
                {/* Result Layer (Bottom) */}
                {scratchResult && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 text-center p-4">
                        <span className="text-4xl">
                            {scratchResult.value > 0 ? '🏆' : '😢'}
                        </span>
                        <h4 className="font-bold text-xl text-yellow-900 mt-2">{scratchResult.label}</h4>
                        {scratchResult.value > 0 && <p className="text-sm text-yellow-700 font-medium">+{scratchResult.value} pts</p>}
                    </div>
                )}

                {/* Overlay Layer (Canvas) */}
                {isReadyToScratch && !isAlreadyScratched && (
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 z-20 touch-none cursor-crosshair transition-opacity duration-700 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        onMouseMove={handleScratch}
                        onTouchMove={handleScratch}
                        onMouseDown={handleScratch}
                    />
                )}

                {/* Start/Status Layer */}
                {!isReadyToScratch && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-200/90 backdrop-blur-sm">
                        {loading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        ) : isAlreadyScratched ? (
                            <div className="text-center p-4">
                                <p className="font-bold text-gray-400">Come back tomorrow!</p>
                                <p className="text-xs text-gray-500 mt-1">Daily Limit Reached</p>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-6 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-full shadow-lg hover:bg-yellow-300"
                            >
                                Scratch Now
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 text-center z-10">
                <p className="text-gray-500 text-sm">Scratch to reveal hidden points!</p>
                {error && !isAlreadyScratched && <p className="text-red-500 text-xs mt-2">{typeof error === 'string' ? error : 'An error occurred'}</p>}
            </div>
        </div>
    );
};

export default ScratchCard;
