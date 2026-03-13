import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({ 
  label, 
  options, 
  placeholder = "Select option", 
  className = "",
  value,
  ...props 
}) => {
  
  const isPlaceholderActive = value === "" || value === undefined;
  const textColorClass = isPlaceholderActive ? "text-text-muted" : "text-text-main";

  return (
    <div className={`inline-flex flex-col justify-center items-start gap-1.25 w-full ${className}`}>
      
      {label && (
        <label className="text-center justify-center text-sm font-medium text-text-body font-sans">
          {label} {props.required && <span className="text-state-error">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <select
          value={value}
          className={`
            w-full h-10 pl-3 pr-10 py-1.5
            bg-bg-card rounded-md 
            outline-1 -outline-offset-1 outline-border-line
            appearance-none cursor-pointer
            text-sm font-medium font-sans
            focus:outline-2 focus:-outline-offset-2 focus:outline-brand-primary
            transition-all duration-200
            disabled:bg-bg-app disabled:text-text-muted disabled:cursor-not-allowed
            ${textColorClass}
          `}
          {...props}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-text-main">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex justify-center items-center w-5 h-5 text-brand-primary">
          <ChevronDown size={16} strokeWidth={3} />
        </div>

      </div>
    </div>
  );
};