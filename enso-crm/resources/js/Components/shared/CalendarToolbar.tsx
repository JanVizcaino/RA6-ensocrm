import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { SegmentedControl } from './SegmentedControl';

interface CalendarToolbarProps {
  currentDateLabel: string; 
  viewMode: string;         
  onViewModeChange: (mode: string) => void;
  onTodayClick: () => void;
  onPrevClick: () => void;
  onNextClick: () => void;
  onAddEventClick: () => void;
  className?: string;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDateLabel,
  viewMode,
  onViewModeChange,
  onTodayClick,
  onPrevClick,
  onNextClick,
  onAddEventClick,
  className = ''
}) => {
  return (
    <div 
      className={`
        flex justify-between items-center w-full 
        px-6 py-4 
        bg-bg-card rounded-lg 
        outline -outline-offset-1 outline-border-line 
        ${className}
      `}
    >
      <div className="flex-1 flex justify-start">
        <Button 
          variant="ghost" 
          icon={<ArrowLeft size={14} />} 
          iconPosition="left"
          onClick={onTodayClick}
        >
          Hoy
        </Button>
      </div>

      <div className="flex-1 flex justify-center items-center gap-2">
        <Button 
          variant="icon-only" 
          icon={<ChevronLeft size={18} />} 
          onClick={onPrevClick}
          aria-label="Mes anterior"
        />
        
        <h2 className="w-40 text-center text-brand-primary text-[22px] font-semibold font-sans truncate">
          {currentDateLabel}
        </h2>
        
        <Button 
          variant="icon-only" 
          icon={<ChevronRight size={18} />} 
          onClick={onNextClick}
          aria-label="Mes siguiente"
        />
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        <SegmentedControl
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: 'mes', label: 'Mes' },
            { value: 'semana', label: 'Semana' },
            { value: 'dia', label: 'Día' }
          ]}
        />
        
        <Button 
          icon={<CalendarPlus size={16} />} 
          iconPosition="left"
          onClick={onAddEventClick}
        >
          Agendar sesión
        </Button>
      </div>
    </div>
  );
};