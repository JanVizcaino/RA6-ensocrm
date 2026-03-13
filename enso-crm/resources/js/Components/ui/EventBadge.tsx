import React from 'react';

export type EventTheme = 'brand' | 'fp' | 'eso' | 'gray';

interface EventBadgeProps {
  time?: string;
  label: string;
  theme?: EventTheme;
  className?: string;
}

export const EventBadge: React.FC<EventBadgeProps> = ({
  time,
  label,
  theme = 'brand',
  className = ''
}) => {
  
  const themeStyles: Record<EventTheme, string> = {
    brand: 'bg-brand-surface border-brand-primary text-brand-primary', 
    fp:    'bg-fp-surface border-fp-primary text-fp-primary',      
    eso:   'bg-eso-surface border-eso-primary text-eso-primary',      
    gray:  'bg-bg-app border-text-muted text-text-body'             
  };

  return (
    <div 
      className={`
        w-full p-2.5 overflow-hidden 
        border-l-[3px] 
        inline-flex justify-start items-center gap-2.5 
        transition-colors duration-200
        ${themeStyles[theme]}
        ${className}
      `}
    >
      <span className="text-xs font-medium font-sans truncate flex flex-col justify-center text-left">
        {time ? `${time} - ${label}` : label}
      </span>
    </div>
  );
};