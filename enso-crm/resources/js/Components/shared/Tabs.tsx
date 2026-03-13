import React from 'react';

export interface TabOption {
  label: string;
  value: string;
}

export type TabTheme = 'brand' | 'fp' | 'eso';

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  theme?: TabTheme;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  value,
  onChange,
  theme = 'brand',
  className = ''
}) => {
  
  const activeBorderColors: Record<TabTheme, string> = {
    brand: 'border-brand-primary',
    fp:    'border-fp-primary',
    eso:   'border-eso-primary'
  };

  return (
    <div className={`flex items-center w-full border-b border-border-line ${className}`}>
      
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex justify-center items-center flex-col
              px-4 py-3 -mb-px
              text-sm font-sans whitespace-nowrap
              border-b-2 transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:rounded-t-sm
              ${isActive
                ? `${activeBorderColors[theme]} text-text-main font-medium`
                : 'border-transparent text-text-muted hover:text-text-body hover:border-border-line/60 font-normal'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
      
    </div>
  );
};