import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode; 
}

export const TextInput: React.FC<TextInputProps> = ({ 
  label, 
  helperText, 
  error, 
  className = "",
  icon, 
  ...props 
}) => {
  return (
    <div className={`inline-flex flex-col justify-start items-start gap-2 w-full ${className}`}>
      {label && (
        <label className="self-stretch text-sm font-medium text-text-body font-sans">
          {label} {props.required && <span className="text-state-error">*</span>}
        </label>
      )}
      
      <div className="relative self-stretch">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          className={`
            self-stretch w-full h-10 
            ${icon ? 'pl-10 pr-3' : 'px-3'} py-2
            
            bg-bg-card rounded-md shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
            outline -outline-offset-1 outline-border-line 
            text-sm text-text-main placeholder:text-text-muted 
            font-normal font-sans
            
            focus:outline-2 focus:-outline-offset-2 focus:outline-brand-primary 
            
            transition-all duration-200
            
            disabled:bg-bg-app disabled:text-text-muted
            ${error 
              ? 'outline-state-error focus:outline-state-error text-state-error bg-state-error-subtle/30' 
              : ''
            }
          `}
          {...props}
        />
      </div>
      
      {(helperText || error) && (
        <span className={`self-stretch text-xs font-normal font-sans ${error ? 'text-state-error' : 'text-text-muted'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};