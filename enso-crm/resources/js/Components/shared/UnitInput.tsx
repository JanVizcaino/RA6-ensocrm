import React from 'react';

interface UnitInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit: string;
  error?: string;
}

export const UnitInput: React.FC<UnitInputProps> = ({
  label,
  unit,
  error,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className={`inline-flex flex-col justify-center items-start gap-2 w-full ${className}`}>
      
      {label && (
        <label className="text-sm font-normal text-text-body font-sans">
          {label}
        </label>
      )}
      
      <div 
        className={`
          flex w-full rounded-lg overflow-hidden
          outline -outline-offset-1 outline-border-line
          focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brand-primary
          transition-all duration-200
          ${disabled ? 'opacity-75 cursor-not-allowed' : ''}
          ${error ? 'outline-state-error focus-within:outline-state-error' : ''}
        `}
      >
        <input
          type="text"
          disabled={disabled}
          className={`
            flex-1 w-full px-3 py-2 bg-bg-card
            text-sm text-text-body font-normal font-sans
            outline-none border-none
            placeholder:text-text-muted
            disabled:bg-bg-app disabled:cursor-not-allowed
            ${error ? 'bg-state-error-subtle/30 text-state-error' : ''}
          `}
          {...props}
        />
        
        <div 
          className={`
            flex items-center justify-center px-3 shrink-0
            bg-bg-app border-l border-border-line
            text-sm text-text-main font-normal font-sans
            ${error ? 'border-state-error/50 text-state-error bg-state-error-subtle/50' : ''}
          `}
        >
          {unit}
        </div>
      </div>

      {error && (
        <span className="text-xs font-normal font-sans text-state-error">
          {error}
        </span>
      )}
      
    </div>
  );
};