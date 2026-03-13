import React from 'react';

export type LogLevel = 'success' | 'warning' | 'error' | 'info';

export interface LogLineProps {
  message: string;
  timestamp: string;
  level?: LogLevel;
  className?: string;
}

export const LogLine: React.FC<LogLineProps> = ({
  message,
  timestamp,
  level = 'info',
  className = ''
}) => {
  
  const levelStyles: Record<LogLevel, string> = {
    success: 'border-state-success text-state-success bg-state-success-subtle',
    warning: 'border-state-warning text-state-warning bg-state-warning-subtle',
    error: 'border-state-error text-state-error bg-state-error-subtle',
    info: 'border-transparent text-text-body hover:bg-bg-card' 
  };

  return (
    <div 
      className={`
        flex items-start gap-3 
        w-full px-3 py-1.5 
        border-l-2 
        font-mono text-xs leading-relaxed tracking-tight
        transition-colors duration-150
        ${levelStyles[level]}
        ${className}
      `}
    >
      <span className="text-text-muted shrink-0 select-none">
        [{timestamp}]
      </span>
      
      <span className="flex-1 wrap-break-word">
        {message}
      </span>
    </div>
  );
};