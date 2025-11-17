'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import { SocketProvider } from '@/context/SocketContext';
import { TableSessionProvider } from '@/context/TableSessionContext';
import './globals.css';
import { useEffect } from 'react';



export default function RootLayout({ children }) {
  // ✅ Suppress hydration warnings from browser extensions
  useEffect(() => {
    // Remove attributes added by browser extensions
    if (typeof window !== 'undefined') {
      document.body.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="bg-black text-white antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <SocketProvider>
            <OrderProvider>
              <TableSessionProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: '#18181b',
                      color: '#ffffff',
                      border: '1px solid #27272a',
                    },
                    success: {
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </TableSessionProvider>
            </OrderProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
