import React from 'react';
import { ChevronRight } from 'lucide-react';
import { IconWrapper, IconTheme } from '../ui/IconWrapper';

interface QuickActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  icon: React.ReactNode;
  theme?: IconTheme; 
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  title, 
  icon, 
  theme = 'brand',
  className = '', 
  ...props 
}) => {
  return (
    <button 
      type="button"
      className={`
        group w-full h-16 px-6 
        bg-bg-app rounded-lg 
        flex justify-between items-center gap-4 text-left
        transition-all duration-200 ease-in-out
        outline -outline-offset-1 outline-transparent
        hover:bg-bg-card hover:shadow-sm hover:outline-border-line
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1
        ${className}
      `}
      {...props}
    >
      <IconWrapper 
        icon={icon} 
        theme={theme} 
        variant="circle" 
        className="transition-transform duration-200 group-hover:scale-105"
      />

      <div className="flex-1">
        <span className="block text-base font-medium font-sans text-text-main">
          {title}
        </span>
      </div>

      <div className="text-text-muted transition-all duration-200 group-hover:text-brand-primary group-hover:translate-x-1">
        <ChevronRight size={20} strokeWidth={2.5} />
      </div>
      
    </button>
  );
};