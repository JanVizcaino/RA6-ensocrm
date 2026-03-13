import React from 'react';

export type IconVariant = 'circle' | 'square' | 'transparent';
export type IconTheme = 'brand' | 'fp' | 'eso' | 'success' | 'warning' | 'error' | 'info';

interface IconWrapperProps {
  icon: React.ReactNode;
  variant?: IconVariant;
  theme?: IconTheme;
  className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon,
  variant = 'circle',
  theme = 'brand',
  className = ''
}) => {
  
  const themeStyles: Record<IconTheme, { bg: string, text: string }> = {
    brand:   { bg: 'bg-brand-surface', text: 'text-brand-primary' },    
    fp:      { bg: 'bg-fp-surface', text: 'text-fp-primary' },           
    eso:     { bg: 'bg-eso-surface', text: 'text-eso-primary' },         
    success: { bg: 'bg-state-success-subtle', text: 'text-state-success' }, 
    warning: { bg: 'bg-state-warning-subtle', text: 'text-state-warning' }, 
    error:   { bg: 'bg-state-error-subtle', text: 'text-state-error' },    
    info:    { bg: 'bg-state-info-subtle', text: 'text-state-info' },      
  };

  const currentTheme = themeStyles[theme];

  const variantStyles: Record<IconVariant, string> = {
    circle: `rounded-full ${currentTheme.bg}`,
    square: `rounded-md ${currentTheme.bg}`, 
    transparent: 'bg-transparent'
  };

  return (
    <div 
      className={`
        inline-flex justify-center items-center shrink-0
        w-10 h-10 
        transition-colors duration-200
        ${variantStyles[variant]}
        ${currentTheme.text}
        ${className}
      `}
    >
      {icon}
    </div>
  );
};