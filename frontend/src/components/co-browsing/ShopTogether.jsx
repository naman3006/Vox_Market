import React, { useState, useEffect } from 'react';
import { Box, Fab, Dialog, DialogTitle, DialogContent, TextField, Button, Typography, IconButton } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

const ShopTogether = ({ session, participants, isConnected, onCreateSession, onJoinSession, onLeaveSession }) => {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [joinId, setJoinId] = useState('');
    const location = useLocation();

    // Parse session ID from URL query param if present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sid = params.get('session_id');
        if (sid && !session) {
            setJoinId(sid);
            setOpen(true); // Open modal to ask for name
        }
    }, [location, session]);

    const handleCreate = () => {
        if (!username) return toast.warning('Please enter a name');
        onCreateSession(username);
    };

    const handleJoin = () => {
        if (!username || !joinId) return toast.warning('Name and Session ID required');
        onJoinSession(joinId, username);
    };

    const copyLink = () => {
        const link = `${window.location.origin}?session_id=${session.sessionId}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="shop-together"
                sx={{
                    position: 'fixed',
                    bottom: 90,
                    right: 20,
                    zIndex: 1000,
                    backgroundColor: session ? '#4caf50' : '#1976d2',
                    '&:hover': {
                        backgroundColor: session ? '#45a049' : '#1565c0'
                    }
                }}
                onClick={() => setOpen(true)}
            >
                <GroupIcon />
                {session && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            bgcolor: isConnected ? '#4caf50' : '#ff9800', // Green if connected, Orange if reconnecting
                            borderRadius: '50%',
                            border: '2px solid white'
                        }}
                    />
                )}
            </Fab>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Shop Together
                    <IconButton onClick={() => setOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {!isConnected && session ? (
                        <Typography color="warning.main" align="center">Reconnecting...</Typography>
                    ) : null}

                    {session ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Session Active
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{
                                    bgcolor: session.role === 'HOST' ? 'primary.main' : 'secondary.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1
                                }}>
                                    {session.role || 'GUEST'}
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                ID: <strong>{session.sessionId}</strong>
                            </Typography>

                            {/* Participants List */}
                            <Box sx={{ mb: 2, textAlign: 'left', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    PARTICIPANTS ({Object.keys(participants || {}).length + 1})
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {/* Self */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isConnected ? '#4caf50' : '#bdbdbd' }} />
                                        <Typography variant="body2" fontWeight="bold">
                                            {session.username} (You)
                                        </Typography>
                                    </Box>
                                    {/* Others */}
                                    {participants && Object.values(participants).map((p, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: p.status === 'offline' ? '#bdbdbd' : p.color
                                            }} />
                                            <Typography variant="body2" sx={{ color: p.status === 'offline' ? 'text.disabled' : 'text.primary' }}>
                                                {p.username} {p.status === 'offline' && '(Offline)'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<ContentCopyIcon />}
                                onClick={copyLink}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Copy Invite Link
                            </Button>

                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => { onLeaveSession(); setOpen(false); }}
                                fullWidth
                            >
                                Leave Session
                            </Button>

                            <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                                {session.role === 'HOST' ? 'You are leading the session.' : 'You are following the host.'}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {/* ... Login/Join forms same as before, just kept standard ... */}
                            {!isConnected && <Typography color="error">Connecting to service...</Typography>}

                            <TextField
                                label="Your Name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                fullWidth
                                autoFocus
                            />

                            {joinId ? (
                                <>
                                    <TextField
                                        label="Session ID to Join"
                                        value={joinId}
                                        disabled
                                        fullWidth
                                    />
                                    <Button variant="contained" onClick={handleJoin} disabled={!isConnected} fullWidth>
                                        Join Session
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="contained" onClick={handleCreate} disabled={!isConnected} fullWidth>
                                        Start New Session
                                    </Button>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                                        <Typography variant="caption" color="text.secondary">OR</Typography>
                                        <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                                    </Box>
                                    <TextField
                                        label="Enter Session ID to Join"
                                        value={joinId}
                                        onChange={(e) => setJoinId(e.target.value)}
                                        fullWidth
                                    />
                                    <Button variant="outlined" onClick={handleJoin} disabled={!joinId || !isConnected}>
                                        Join Existing
                                    </Button>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ShopTogether;
