import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon-only';
type IconPosition = 'left' | 'right';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition; 
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  icon,
  iconPosition = 'left', 
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center h-10 font-medium text-sm font-sans transition-all focus:outline-2 focus:-outline-offset-2 focus:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-primary text-white hover:opacity-90 px-4 gap-2.5 rounded-md shadow-sm",
    
    secondary: "bg-brand-surface text-brand-primary outline outline-1 -outline-offset-1 outline-brand-primary hover:bg-brand-primary/10 px-4 gap-2.5 rounded-md",
  
    ghost: "bg-transparent text-text-body hover:bg-border-line/50 hover:text-text-main px-2.5 py-1.5 gap-1.5 rounded-md", 
    
    'icon-only': "w-10 h-10 bg-brand-surface text-brand-primary rounded-full hover:bg-brand-primary/10 gap-0",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}

      {!isLoading && icon && iconPosition === 'left' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}

      {variant !== 'icon-only' && children && (
        <span>{children}</span>
      )}

      {!isLoading && icon && iconPosition === 'right' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}
    </button>
  );
};