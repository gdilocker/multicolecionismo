import React, { useState, useEffect } from 'react';
import { PanelSidebar } from './PanelSidebar';
import { useDrawer } from '../contexts/DrawerContext';

interface PanelLayoutProps {
  children: React.ReactNode;
}

export const PanelLayout: React.FC<PanelLayoutProps> = ({ children }) => {
  const { isInDrawer } = useDrawer();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInDrawer) {
      setSidebarOpen(true);
    }
  }, [isInDrawer]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <PanelSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:pl-70 transition-all duration-300">
        <main className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-28">
          {children}
        </main>
      </div>
    </div>
  );
};
