import React, { ReactNode } from 'react';
import { Header } from '../Components/layout/Header'; 
import { usePage } from '@inertiajs/react';
import { PageProps } from '../types';

interface Props {
  children: ReactNode;
}

export default function GamifiedLayout({ children }: Props) {
  const { auth } = usePage<PageProps>().props;

  return (
    <div className="min-h-screen bg-bg-app font-sans flex flex-col">
      <Header onToggleSidebar={() => {}} userRole={auth.user.role} />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {children}
        </div>
      </main>
    </div>
  );
}