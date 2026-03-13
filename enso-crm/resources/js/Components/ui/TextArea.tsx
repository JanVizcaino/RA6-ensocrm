import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ 
  label, 
  helperText, 
  error, 
  className = "", 
  ...props 
}) => {
  return (
    <div className={`inline-flex flex-col justify-start items-start gap-1.5 w-full ${className}`}>
      {label && (
        <label className="justify-center text-sm font-medium text-text-body font-sans">
          {label} {props.required && <span className="text-state-error">*</span>}
        </label>
      )}
      
      <textarea
        className={`
          self-stretch h-24 px-3 py-2.5
          bg-bg-card rounded-md shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
          outline -outline-offset-1 outline-border-line
          text-sm text-text-main placeholder:text-text-muted font-normal font-sans
          focus:outline-2 focus:-outline-offset-2 focus:outline-brand-primary
          transition-all duration-200 resize-y
          disabled:bg-bg-app disabled:text-text-muted
          ${error 
            ? 'outline-state-error focus:outline-state-error text-state-error bg-state-error-subtle/30' 
            : ''
          }
        `}
        {...props}
      />
      
      {(helperText || error) && (
        <span className={`justify-center text-xs font-normal font-sans ${error ? 'text-state-error' : 'text-text-muted'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};