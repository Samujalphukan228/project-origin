'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(undefined);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const SERVER_URL = process.env.NEXT_PUBLIC_API_URL 
        
        const adminToken = typeof window !== 'undefined' 
            ? localStorage.getItem('adminToken') 
            : null;

        const socketInstance = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            auth: {
                token: adminToken,
            },
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            setSocket(socketInstance);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketInstance.on('connect_error', () => {
            setIsConnected(false);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
}