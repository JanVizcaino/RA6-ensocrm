import React from 'react';

interface DashboardQuickActionsProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  title = "Quick Actions",
  children,
  className = ''
}) => {
  return (
    <div 
      className={`
        w-full sm:w-80 p-5 
        bg-brand-primary rounded-lg shadow-sm 
        flex flex-col justify-start items-start gap-6 
        overflow-hidden
        ${className}
      `}
    >
      <h2 className="text-brand-surface text-lg font-bold font-sans tracking-tight w-full text-center">
        {title}
      </h2>

      <div className="w-full flex flex-col justify-start items-start gap-2.5">
        {children}
      </div>
      
    </div>
  );
};