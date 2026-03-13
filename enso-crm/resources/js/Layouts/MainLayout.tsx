import React, { useState, ReactNode } from 'react';
import { Sidebar } from '../Components/layout/SideBar';
import { Header } from '../Components/layout/Header';
import { usePage } from '@inertiajs/react';
import { PageProps } from '../types';

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Extraemos auth, pero con un valor por defecto vacío por si acaso
  const { auth } = usePage<PageProps>().props;
  
  // Extraemos el rol de forma segura usando "?"
  const userRole = auth?.user?.role;

  return (
    <div className="flex h-screen w-full bg-bg-app font-sans overflow-hidden">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        isCollapsed={isCollapsed}
        onClose={() => setIsSidebarOpen(false)} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          userRole={userRole} 
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden relative">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
             {children}
          </div>
        </main>

      </div>
    </div>
  );
}