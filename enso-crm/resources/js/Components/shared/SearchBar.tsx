import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

type SearchVariant = 'default' | 'compact';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  variant?: SearchVariant;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className = "", 
  variant = 'default',
  placeholder,
  ...props 
}) => {
  
  const isCompact = variant === 'compact';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCompact) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus(); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompact]); 

  const defaultPlaceholder = isCompact ? 'Search...' : 'Search users, games, collections...';

  return (
    <div
      onClick={() => inputRef.current?.focus()} 
      className={`
        group flex items-center justify-center gap-2.5
        ${isCompact ? 'h-8 px-2' : 'h-10 px-3 py-2.5'}
        bg-bg-app hover:bg-border-line/50 
        rounded-lg border border-transparent 
        transition-all duration-200 cursor-text
        w-full 
        focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brand-primary
        ${className}
      `}
    >
      <div className={`${isCompact ? 'w-5 h-3' : 'w-7 h-4'} flex justify-center items-center text-text-muted group-focus-within:text-brand-primary transition-colors`}>
        <Search size={isCompact ? 14 : 16} strokeWidth={2.5} />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder || defaultPlaceholder}
        className={`
          flex-1 bg-transparent border-none outline-none 
          text-text-main placeholder:text-text-muted font-light font-sans truncate
          ${isCompact ? 'text-xs' : 'text-sm'}
        `}
        {...props}
      />

      {!isCompact && (
        <div className="hidden sm:flex px-1.5 py-0.5 rounded outline -outline-offset-1 outline-border-line bg-bg-card shadow-sm overflow-hidden transition-colors group-hover:bg-white select-none pointer-events-none">
          <span className="text-center justify-center text-text-muted text-[10px] font-light font-sans leading-none tracking-wider">
            Ctrl K
          </span>
        </div>
      )}
    </div>
  );
};