import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Snackbar, Alert, Typography, Box } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityToast = () => {
    const { socket, isConnected } = useSocket('social-proof');
    const [notification, setNotification] = useState(null);
    const [queue, setQueue] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (socket && isConnected) {
            const handleNewActivity = (data) => {
                setQueue((prev) => [...prev, data]);
            };

            socket.on('new_activity', handleNewActivity);

            return () => {
                socket.off('new_activity', handleNewActivity);
            };
        }
    }, [socket, isConnected]);

    // Process queue one by one
    useEffect(() => {
        if (queue.length > 0 && !open) {
            const next = queue[0];
            setNotification(next);
            setOpen(true);
            setQueue((prev) => prev.slice(1));
        }
    }, [queue, open]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={4000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            TransitionProps={{ onExited: () => setNotification(null) }}
        >
            <Box>
                {notification && (
                    <Alert
                        icon={<ShoppingBagIcon fontSize="inherit" />}
                        severity="info"
                        onClose={handleClose}
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            color: '#333',
                            '.MuiAlert-icon': { color: '#4caf50' }
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Someone in <b>{notification.city}, {notification.country}</b>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            just bought <b>{notification.product}</b>
                        </Typography>
                    </Alert>
                )}
            </Box>
        </Snackbar>
    );
};

export default ActivityToast;
