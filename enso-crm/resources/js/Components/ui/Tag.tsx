import React from 'react';
import { X } from 'lucide-react';

export type TagTheme = 'brand' | 'fp' | 'eso' | 'neutral';

interface TagProps {
  label: string;
  theme?: TagTheme;
  onRemove?: () => void;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  label,
  theme = 'neutral',
  onRemove,
  className = ''
}) => {
  
  const themeStyles: Record<TagTheme, string> = {
    brand: 'bg-brand-surface text-brand-primary outline-brand-primary/20',
    fp:    'bg-fp-surface text-fp-primary outline-fp-primary/20',
    eso:   'bg-eso-surface text-eso-primary outline-eso-primary/20',
    neutral: 'bg-bg-app text-text-body outline-border-line'
  };

  const iconHoverStyles: Record<TagTheme, string> = {
    brand: 'hover:bg-brand-primary/20 hover:text-brand-primary',
    fp:    'hover:bg-fp-primary/20 hover:text-fp-primary',
    eso:   'hover:bg-eso-primary/20 hover:text-eso-primary',
    neutral: 'hover:bg-border-line hover:text-text-main'
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 
        px-2.5 py-1 
        rounded-md outline-1 -outline-offset-1
        text-xs font-medium font-sans whitespace-nowrap
        transition-colors duration-200
        ${themeStyles[theme]}
        ${className}
      `}
    >
      <span>{label}</span>
      
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={`
            flex items-center justify-center 
            w-4 h-4 rounded-sm shrink-0
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
            ${iconHoverStyles[theme]}
          `}
          aria-label={`Eliminar ${label}`}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};