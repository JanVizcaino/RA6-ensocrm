import React from 'react';

export interface SegmentedOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  label?: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  label,
  options,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`inline-flex flex-col justify-start items-start gap-2 ${className}`}>
      
      {label && (
        <span className="text-xs font-normal text-text-body font-sans">
          {label}
        </span>
      )}

      <div className="inline-flex items-center justify-start gap-0.5 p-1 bg-bg-app rounded-lg">
        
        {options.map((option) => {
          const isActive = option.value === value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                px-3 py-1.5 rounded-[5px] 
                text-xs font-normal font-sans whitespace-nowrap
                transition-all duration-200 ease-in-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
                ${isActive
                  ? 'bg-bg-card text-text-main shadow-sm'
                  : 'text-text-muted hover:text-text-body hover:bg-bg-app/80'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
        
      </div>
    </div>
  );
};