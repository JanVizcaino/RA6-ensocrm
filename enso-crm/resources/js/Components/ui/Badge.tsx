import React from 'react';

export type BadgeVariant = 'green' | 'red' | 'gray' | 'blue' | 'yellow';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string; 
  variant?: BadgeVariant;
  withDot?: boolean; 
}

export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  variant = 'gray', 
  withDot = true,
  className = '',
  ...props 
}) => {
  
  const styles: Record<BadgeVariant, string> = {
    green: "bg-state-success-subtle text-state-success",  
    yellow: "bg-state-warning-subtle text-state-warning",
    red: "bg-state-error-subtle text-state-error",      
    gray: "bg-state-info-subtle text-state-info",        
    blue: "bg-brand-surface text-brand-primary"          
  };

  return (
    <div 
      className={`
        inline-flex justify-center items-center gap-1.5 
        h-5 px-2.5 py-0.5 
        rounded-full overflow-hidden
        text-xs font-medium font-sans whitespace-nowrap
        transition-colors duration-200
        ${styles[variant]}
        ${className} 
      `}
      {...props} 
    >
      {withDot && (
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      )}
      
      {label && (
        <span className="text-center leading-none">{label}</span>
      )}
    </div>
  );
};