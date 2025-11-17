

import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/socketContext';
import { MenuProvider } from '../context/menuContext';
import { EmployeeProvider } from '../context/employeeContext';
import { OrderProvider } from '../context/OrderContext';
import { AdminTableSessionProvider } from '@/context/AdminTableSessionContext';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Restaurant Admin Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SocketProvider>
            <MenuProvider>
              <EmployeeProvider>
                <OrderProvider>
                  <AdminTableSessionProvider>
                    {children}
                  </AdminTableSessionProvider>
                  </OrderProvider>
              </EmployeeProvider>
            </MenuProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
