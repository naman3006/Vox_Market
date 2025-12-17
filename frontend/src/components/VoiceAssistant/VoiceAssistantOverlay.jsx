import React from 'react';
import { createPortal } from 'react-dom';

const VoiceAssistantOverlay = ({ isOpen, isListening, transcript, interimTranscript, feedback, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 relative animate-scale-up">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Microphone Animation */}
                    <div className={`relative w-24 h-24 flex items-center justify-center rounded-full bg-primary-50 ${isListening ? 'animate-pulse-ring' : ''}`}>
                        <div className={`absolute inset-0 rounded-full border-2 border-primary-500 opacity-20 ${isListening ? 'animate-ping' : ''}`}></div>
                        <svg
                            className={`w-12 h-12 text-primary-600 ${isListening ? 'animate-bounce-subtle' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>

                    {/* Status Text */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {feedback || (isListening ? "I'm listening..." : "Processing...")}
                        </h3>
                        {(transcript || interimTranscript) && (
                            <p className="text-lg text-gray-600 font-medium italic">
                                "{interimTranscript || transcript}"
                            </p>
                        )}
                        {!(transcript || interimTranscript) && isListening && (
                            <p className="text-sm text-gray-500">
                                Try saying "open Cart","Scroll down"
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scale-up {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out forwards;
                }
                 .animate-pulse-ring {
                    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
                    animation: pulse-ring 2s cubic-bezier(0.66, 0, 0, 1) infinite;
                }
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
                    70% { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite;
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default VoiceAssistantOverlay;
