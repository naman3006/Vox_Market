import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import throttle from 'lodash.throttle';
import { useNavigate, useLocation } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useCoBrowsing = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [session, setSession] = useState(null); // { sessionId, userId, role, color }
    const [participants, setParticipants] = useState({});
    const [reactions, setReactions] = useState([]); // Array of { id, emoji, x, y }

    const participantsRef = useRef({});
    const navigate = useNavigate();
    const location = useLocation();

    // Throttle cursor emission
    // eslint-disable-next-line
    const emitCursorMove = useCallback(
        throttle((x, y) => {
            if (socket && socket.connected) {
                socket.emit('cursor_move', { x, y });
            }
        }, 50),
        [socket]
    );

    useEffect(() => {
        const newSocket = io(`${SOCKET_URL}/co-browsing`, {
            autoConnect: true,
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to Co-Browsing');
            setIsConnected(true);

            // Attempt Reconnection
            const savedSession = localStorage.getItem('coBrowsingSession');
            if (savedSession) {
                const { sessionId, userId, username } = JSON.parse(savedSession);
                newSocket.emit('rejoin_session', { sessionId, userId, username }, (response) => {
                    if (response.success) {
                        setSession({ ...response, sessionId }); // Ensure sessionId is in state
                        updateParticipants(response.participants);
                        toast.success('Reconnected to session!');
                    } else {
                        localStorage.removeItem('coBrowsingSession'); // Clear invalid session
                    }
                });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Co-Browsing');
            setIsConnected(false);
        });

        newSocket.on('participant_joined', (data) => {
            const { userId, username, color, role } = data;
            toast.info(`${username} joined the session!`);

            setParticipants(prev => {
                const next = { ...prev, [userId]: { username, color, role, x: 0, y: 0 } };
                participantsRef.current = next;
                return next;
            });
        });

        newSocket.on('participant_left', (data) => {
            const { userId } = data;
            setParticipants(prev => {
                const next = { ...prev };
                delete next[userId];
                participantsRef.current = next;
                return next;
            });
        });

        newSocket.on('cursor_update', (data) => {
            const { userId, x, y, username, color } = data;

            if (!participantsRef.current[userId]) {
                setParticipants(prev => {
                    const next = { ...prev, [userId]: { username, color, x, y, role: 'GUEST' } };
                    participantsRef.current = next;
                    return next;
                });
            } else {
                setParticipants(prev => ({
                    ...prev,
                    [userId]: { ...prev[userId], x, y }
                }));
            }
        });

        newSocket.on('navigation_update', (data) => {
            const { path, triggeredBy } = data;
            if (window.location.pathname !== path) {
                console.log(`Navigating to ${path} synced by ${triggeredBy}`);
                navigate(path);
                toast.info(`Synced navigation to ${path}`);
            }
        });

        // Sync Actions
        newSocket.on('action_synced', (data) => {
            const { type, payload, fromUser } = data;
            if (type === 'ADD_TO_CART') {
                toast.success(`${fromUser} added ${payload.productName} to cart!`);
            }
        });

        // Event: Reaction Received
        newSocket.on('reaction_received', (data) => {
            const { userId, emoji } = data; // Now expecting userId
            const participant = participantsRef.current[userId];
            // Also handle self-reaction if broadast includes sender (it usually does for simplicity, but let's see)

            const target = participant || (session && session.userId === userId ? { x: window.innerWidth / 2, y: window.innerHeight / 2, color: session.color } : null);

            if (target) {
                const reaction = {
                    id: Date.now() + Math.random(),
                    emoji,
                    x: target.x || window.innerWidth / 2,
                    y: target.y || window.innerHeight / 2,
                    color: target.color
                };

                setReactions(prev => [...prev, reaction]);

                setTimeout(() => {
                    setReactions(prev => prev.filter(r => r.id !== reaction.id));
                }, 2000);
            }
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [session]); // session dependency for syncing logic if needed, though 'session' variable inside connect listener might be stale if closure..
    // Actually, local storage read inside connect is safe. but 'session' for self-check in reaction might be stale.
    // Fixed by using ref or functional update, but simpler to just depend on it or keep logic clean.

    // Listen to local navigation changes and broadcast
    useEffect(() => {
        if (socket && isConnected && session) {
            socket.emit('navigate', { path: location.pathname });
        }
    }, [location.pathname, socket, isConnected, session]);

    const updateParticipants = (list) => {
        const map = {};
        list.forEach(p => {
            map[p.userId] = { username: p.username, color: p.color, role: p.role, x: 0, y: 0 };
        });
        setParticipants(map);
        participantsRef.current = map;
    };

    const createSession = (username) => {
        if (!socket) return;
        const stored = localStorage.getItem('coBrowsingSession');
        const userId = stored ? JSON.parse(stored).userId : undefined;

        socket.emit('create_session', { username, userId }, (response) => {
            const sessionData = { ...response, username };
            setSession(sessionData);
            localStorage.setItem('coBrowsingSession', JSON.stringify(sessionData));
            toast.success('Session created! Share the link.');
        });
    };

    const joinSession = (sessionId, username) => {
        if (!socket) return;
        const stored = localStorage.getItem('coBrowsingSession');
        const userId = stored ? JSON.parse(stored).userId : undefined;

        socket.emit('join_session', { sessionId, username, userId }, (response) => {
            if (response.error) {
                toast.error(response.error);
            } else {
                const sessionData = { sessionId, userId: response.userId, color: response.color, role: response.role, username };
                setSession(sessionData);
                localStorage.setItem('coBrowsingSession', JSON.stringify(sessionData));

                updateParticipants(response.participants);
                toast.success('Joined session successfully!');
            }
        });
    };

    const broadcastAction = (type, payload) => {
        if (socket && session) {
            socket.emit('sync_action', { type, payload });
        }
    };

    const sendReaction = (emoji) => {
        if (socket) socket.emit('reaction', { emoji });
    };

    const leaveSession = () => {
        setSession(null);
        setParticipants({});
        participantsRef.current = {};
        localStorage.removeItem('coBrowsingSession');
        window.location.reload();
    };

    return {
        socket,
        isConnected,
        session,
        participants,
        reactions,
        createSession,
        joinSession,
        emitCursorMove,
        sendReaction,
        broadcastAction,
        leaveSession
    };
};
