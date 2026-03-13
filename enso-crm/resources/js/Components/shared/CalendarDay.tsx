import React from 'react';
import { EventBadge, EventTheme } from '../ui/EventBadge';

export interface CalendarEvent {
  id: string | number;
  time?: string;
  label: string;
  theme?: EventTheme;
}

interface CalendarDayProps {
  day: number;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  events?: CalendarEvent[];
  onClick?: () => void;
  className?: string;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  isToday = false,
  isCurrentMonth = true,
  events = [],
  onClick,
  className = ''
}) => {
  
  const getDayNumberStyles = () => {
    const base = "w-7 h-7 flex items-center justify-center text-sm font-medium font-sans rounded-full shrink-0";
    
    if (isToday) {
      return `${base} bg-brand-primary text-brand-surface`;
    }
    if (!isCurrentMonth) {
      return `${base} text-text-muted`;
    }
    return `${base} text-text-body`;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        w-full h-35 p-2 
        bg-bg-card 
        outline-1 -outline-offset-1 outline-border-line
        flex flex-col items-end gap-1.5
        overflow-hidden transition-colors
        ${onClick ? 'cursor-pointer hover:bg-bg-app' : ''}
        ${!isCurrentMonth ? 'bg-bg-app/40' : ''}
        ${className}
      `}
    >
      <div className={getDayNumberStyles()}>
        {day}
      </div>

      {events.length > 0 && (
        <div className="w-full flex flex-col items-start gap-1 overflow-y-auto pr-1 pb-1">
          {events.map((event) => (
            <EventBadge 
              key={event.id}
              time={event.time}
              label={event.label}
              theme={event.theme}
            />
          ))}
        </div>
      )}
    </div>
  );
};