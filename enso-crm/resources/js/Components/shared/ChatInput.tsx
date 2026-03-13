import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button'; 

interface ChatInputProps {
  label?: string; 
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  onSend?: (val: string) => void;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  label,
  placeholder = 'Start typing...',
  value,
  onChange,
  onSend,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState('');
  
  const currentValue = value !== undefined ? value : internalValue;
  const hasText = currentValue.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    else setInternalValue(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hasText && onSend) {
      onSend(currentValue);
      setInternalValue(''); 
    }
  };

  const handleSendClick = () => {
    if (hasText && onSend) {
      onSend(currentValue);
      setInternalValue('');
    }
  };

  return (
    <div 
      className={`
        w-full bg-bg-card rounded-full shadow-sm p-1.5
        outline -outline-offset-1 outline-border-line
        flex items-center gap-2
        focus-within:outline-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20
        transition-all duration-200
        ${className}
      `}
    >
      {label && (
        <div className="shrink-0 h-9 px-4 ml-0.5 bg-brand-primary rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium font-sans">
            {label}
          </span>
        </div>
      )}

      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          flex-1 h-10 bg-transparent border-none outline-none 
          text-sm font-sans text-text-main placeholder:text-text-muted
          ${!label ? 'pl-4' : 'pl-1'} 
        `}
      />

      <div className="shrink-0 mr-0.5">
        <Button
          variant="icon-only" 
          icon={
            <Send 
              size={18} 
              strokeWidth={2.5} 
              className={hasText ? 'text-brand-primary translate-x-0.5 -translate-y-0.5 transition-transform' : 'text-text-muted'} 
            />
          }
          onClick={handleSendClick}
          disabled={!hasText}
          aria-label="Enviar mensaje"
          className="bg-transparent hover:bg-brand-surface disabled:bg-transparent"
        />
      </div>
    </div>
  );
};