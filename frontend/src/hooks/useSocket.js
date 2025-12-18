import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useSocket = (namespace = '') => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to specific namespace if provided
        // Ensure URL doesn't end with slash if namespace starts with slash, or handle standard IO logic
        // Socket.io client handles urls like "http://localhost:3000/social-proof"
        const url = namespace ? `${SOCKET_URL}/${namespace}` : SOCKET_URL;

        socketRef.current = io(url, {
            transports: ['websocket'],
            autoConnect: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log(`Connected to socket namespace: ${namespace}`);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket');
            setIsConnected(false);
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [namespace]);

    return { socket: socketRef.current, isConnected };
};
