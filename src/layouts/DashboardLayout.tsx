import React from 'react';
import NavigationSidebar from '../components/NavigationSidebar';
import type { User } from '../utils/supabaseClient';

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, children }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Fixed sidebar */}
      <NavigationSidebar user={user} />

      {/* Only this area scrolls */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
