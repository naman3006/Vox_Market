
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { IconButton, Paper, Typography, Box, Avatar, TextField, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import api from "../../store/api/api";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: '1', text: "Hi! I'm your AI assistant. How can I help you today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { token } = useSelector(state => state.auth);
    const bottomRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare history for API
            const history = messages.map(m => ({
                sender: m.sender,
                text: m.text
            }));

            // If logged in, send with auth token
            let response;
            if (token) {
                const res = await api.post('/chatbot/message', { message: userMsg.text, history });
                response = res.data.data;
            } else {
                // Basic response for guests (or mock if no backend endpoint yet)
                // NOTE: Since we implemented the endpoint with AuthGuard, guest access might fail.
                // For now, let's assume this widget is primarily for logged-in users, 
                // or we should relax the guard.
                // Let's try to call it anyway, api interceptor handles token.
                const res = await api.post('/chatbot/message', { message: userMsg.text, history });
                response = res.data.data;
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), text: response.text, sender: 'bot' }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: "I'm having trouble connecting right now. Please try again.", sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="mb-4"
                    >
                        <Paper
                            className="w-[350px] h-[500px] flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-indigo-50"
                            elevation={6}
                        >
                            {/* Header */}
                            <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <Avatar sx={{ bgcolor: 'white', color: '#4f46e5' }}>
                                        <SmartToyIcon />
                                    </Avatar>
                                    <div>
                                        <Typography variant="subtitle1" fontWeight="bold">AI Assistant</Typography>
                                        <Typography variant="caption" className="opacity-80">Online</Typography>
                                    </div>
                                </div>
                                <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                                ${msg.sender === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}
                                        >
                                            {(msg.text || '').split('\n').map((line, i) => (
                                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                                            <motion.div
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6 }}
                                            />
                                            <motion.div
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                                            />
                                            <motion.div
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <TextField
                                    fullWidth
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    size="small"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '20px',
                                            backgroundColor: '#f9fafb',
                                            '& fieldset': { borderColor: 'transparent' },
                                            '&:hover fieldset': { borderColor: '#e5e7eb' },
                                            '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                                        }
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleSend}
                                                    color="primary"
                                                    disabled={!input.trim() || isTyping}
                                                >
                                                    <SendIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </div>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 z-50 hover:bg-indigo-700 transition-colors"
                style={{ boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}
            >
                {isOpen ? <CloseIcon /> : <SmartToyIcon />}
            </motion.button>
        </div>
    );
};

export default ChatWidget;
