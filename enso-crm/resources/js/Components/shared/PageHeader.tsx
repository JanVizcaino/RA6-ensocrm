import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string; 
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-border-line mb-6 ${className}`}>
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main font-sans tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-muted font-normal font-sans">
            {description}
          </p>
        )}
      </div>

    </div>
  );
};