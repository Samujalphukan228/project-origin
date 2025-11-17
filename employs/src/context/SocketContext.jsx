'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user, loading: authLoading } = useAuth();
    
    const socketRef = useRef(null);
    const mountedRef = useRef(false);
    const connectionAttemptedRef = useRef(false);

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL 

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        // ✅ Wait for auth to complete
        if (authLoading) {
            return;
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // ✅ Disconnect if no auth
        if (!token || !user) {
            if (socketRef.current) {
                console.log('🔌 Disconnecting socket (no auth)');
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setConnected(false);
                connectionAttemptedRef.current = false;
            }
            return;
        }

        // ✅ Don't reconnect if already connected
        if (socketRef.current?.connected) {
            return;
        }

        // ✅ Prevent multiple connection attempts
        if (connectionAttemptedRef.current) {
            return;
        }

        connectionAttemptedRef.current = true;
        console.log('🔌 Initializing socket connection...');

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('🟢 Socket connected:', newSocket.id);
            if (mountedRef.current) {
                setConnected(true);
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔴 Socket disconnected:', reason);
            if (mountedRef.current) {
                setConnected(false);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket error:', error.message);
            if (mountedRef.current) {
                setConnected(false);
            }
        });

        socketRef.current = newSocket;
        if (mountedRef.current) {
            setSocket(newSocket);
        }

        return () => {
            console.log('🧹 Cleaning up socket');
            newSocket.disconnect();
            socketRef.current = null;
            connectionAttemptedRef.current = false;
        };
    }, [user, authLoading, SOCKET_URL]); // ✅ Stable dependencies

    const emit = (eventName, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(eventName, data);
        }
    };

    const joinTable = (tableNumber) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('joinTable', tableNumber);
            console.log(`🪑 Joined table: ${tableNumber}`);
        }
    };

    const joinRoom = (room) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('joinRoom', room);
            console.log(`🚪 Joined room: ${room}`);
        }
    };

    const leaveRoom = (room) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leaveRoom', room);
            console.log(`🚪 Left room: ${room}`);
        }
    };

    // ✅ Stable value object
    const value = {
        socket,
        connected,
        emit,
        joinTable,
        joinRoom,
        leaveRoom,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const useSocketEvent = (eventName, callback) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on(eventName, callback);

        return () => {
            socket.off(eventName, callback);
        };
    }, [socket, eventName, callback]);
};