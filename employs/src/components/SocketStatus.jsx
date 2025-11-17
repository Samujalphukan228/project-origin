'use client';

import { useSocket } from '@/context/SocketContext';

export default function SocketStatus() {
    const { connected } = useSocket();

    if (!connected) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg shadow-lg backdrop-blur-sm">
                <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
                </div>
                <span className="text-xs text-[#888888]">Live</span>
            </div>
        </div>
    );
}