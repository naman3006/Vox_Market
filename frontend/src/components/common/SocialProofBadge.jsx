import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Box, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { motion, AnimatePresence } from 'framer-motion';

const SocialProofBadge = ({ productId }) => {
    const { socket, isConnected } = useSocket('social-proof');
    const [viewers, setViewers] = useState(0);
    const [stats, setStats] = useState({ soldCount: 0, boughtInLast24h: 0 });

    useEffect(() => {
        if (socket && isConnected && productId) {
            socket.emit('join_product', { productId });

            const handleUpdate = (data) => {
                if (data.productId === productId) {
                    setViewers(data.count);
                }
            };

            const handleStats = (data) => {
                if (data.productId === productId) {
                    setStats({
                        soldCount: data.soldCount,
                        boughtInLast24h: data.boughtInLast24h
                    });
                }
            };

            socket.on('viewers_update', handleUpdate);
            socket.on('product_stats', handleStats);

            return () => {
                socket.emit('leave_product', { productId });
                socket.off('viewers_update', handleUpdate);
                socket.off('product_stats', handleStats);
            };
        }
    }, [socket, isConnected, productId]);

    if (viewers <= 1 && stats.boughtInLast24h === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
            >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1 }}>
                    {viewers > 1 && (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                bgcolor: 'rgba(255, 87, 34, 0.1)', // Orange tint
                                color: '#ff5722',
                                padding: '4px 8px',
                                borderRadius: '12px',
                            }}
                        >
                            <VisibilityIcon fontSize="small" />
                            <Typography variant="caption" fontWeight="bold">
                                {viewers} viewing
                            </Typography>
                        </Box>
                    )}

                    {stats.boughtInLast24h > 0 && (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                bgcolor: 'rgba(255, 0, 0, 0.08)', // Red tint for urgency
                                color: '#d32f2f',
                                padding: '4px 8px',
                                borderRadius: '12px',
                            }}
                        >
                            <Typography variant="caption" fontWeight="bold">
                                🔥 {stats.boughtInLast24h} bought in last 24h
                            </Typography>
                        </Box>
                    )}

                    {stats.soldCount > 10 && stats.boughtInLast24h === 0 && (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                bgcolor: 'rgba(76, 175, 80, 0.1)', // Green tint
                                color: '#2e7d32',
                                padding: '4px 8px',
                                borderRadius: '12px',
                            }}
                        >
                            <Typography variant="caption" fontWeight="bold">
                                {stats.soldCount} sold
                            </Typography>
                        </Box>
                    )}
                </Box>
            </motion.div>
        </AnimatePresence>
    );
};

export default SocialProofBadge;
