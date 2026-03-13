import React, { useState, useEffect, useRef } from "react";
import { XCircle, Loader2, ChevronDown, Search } from "lucide-react";

export interface AsyncOption {
  value: string;
  label: string;
}

interface AsyncSelectProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string; 
  icon?: React.ReactNode;
  
  value?: string; 
  initialDisplayValue?: string; 
  onChange: (value: string, option?: AsyncOption) => void;
  
  loadOptions: (query: string) => Promise<AsyncOption[]>;
  
  disabled?: boolean;
}

export const AsyncSelect: React.FC<AsyncSelectProps> = ({
  label,
  placeholder = "Search...",
  helperText,
  error,
  icon,
  value,
  initialDisplayValue = "",
  onChange,
  loadOptions,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(initialDisplayValue);
  const [options, setOptions] = useState<AsyncOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDisplayValue) {
      setInputValue(initialDisplayValue);
    }
  }, [initialDisplayValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!value) setInputValue(""); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setIsOpen(true);

    if (text === "") {
        onChange("");
        setOptions([]);
        return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await loadOptions(text);
        setOptions(results);
      } catch (err) {
        console.error("Error loading options:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (option: AsyncOption) => {
    setInputValue(option.label);
    onChange(option.value, option);
    setIsOpen(false);
    setOptions([]); 
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
    setOptions([]);
    setIsOpen(false);
  };

  return (
    <div className="inline-flex flex-col justify-start items-start gap-2 w-full relative" ref={containerRef}>
      
      {label && (
        <label className="self-stretch text-sm font-medium text-text-body font-sans">
          {label}
        </label>
      )}

      <div 
        className={`
          self-stretch w-full h-10 px-3
          bg-bg-card rounded-md shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
          outline -outline-offset-1 
          flex items-center gap-2
          transition-all duration-200
          
          ${disabled ? 'bg-bg-app cursor-not-allowed opacity-75' : ''}
          ${isOpen ? 'outline-2 -outline-offset-2 outline-brand-primary' : 'outline-border-line'}
          ${error && !isOpen ? 'outline-state-error bg-state-error-subtle/30' : ''}
        `}
      >
        <div className="text-text-muted flex justify-center items-center shrink-0">
          {icon || <Search size={16} />}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
             if(inputValue && !value) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 h-full w-full bg-transparent border-none outline-none 
            text-sm text-text-main font-normal font-sans
            placeholder:text-text-muted
            disabled:text-text-muted disabled:cursor-not-allowed
            ${error ? 'text-state-error' : ''}
          `}
        />

        <div className="flex justify-center items-center shrink-0 w-5 h-5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
          ) : inputValue && !disabled ? (
            <button onClick={handleClear} className="text-text-muted hover:text-state-error transition-colors focus:outline-none rounded-sm focus:ring-1 focus:ring-state-error">
                <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-bg-card rounded-md shadow-lg outline-1 outline-border-line py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg-app hover:text-brand-primary transition-colors flex items-center justify-between group"
                >
                    <span className="font-sans">{opt.label}</span>
                    {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                </button>
            ))}
        </div>
      )}
      
      {isOpen && !loading && inputValue && options.length === 0 && (
         <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-bg-card rounded-md shadow-lg outline-1 outline-border-line p-3 text-center z-50">
            <span className="text-sm font-sans text-text-muted">No results found</span>
         </div>
      )}

      {(helperText || error) && (
        <span className={`self-stretch text-xs font-normal font-sans ${error ? 'text-state-error' : 'text-text-muted'}`}>
          {error || helperText}
        </span>
      )}
      
    </div>
  );
};