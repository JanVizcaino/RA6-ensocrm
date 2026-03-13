import React from 'react';
import { Play, Package, Flame, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconWrapper } from '../ui/IconWrapper';

export type GameCardVariant = 'normal' | 'reduced' | 'gamified';

interface GameCardProps {
  variant?: GameCardVariant;
  title: string;
  category?: string; 
  description?: string;
  icon?: React.ReactNode;
  
  xpReward?: number;
  progress?: number; 
  isHot?: boolean;

  onPlay?: () => void;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  variant = 'normal',
  title,
  category = 'Juego',
  description,
  icon = <Package size={48} />, 
  xpReward = 50,
  progress = 0,
  isHot = false,
  onPlay,
  className = ''
}) => {
  
  const baseCardStyles = `
    w-full bg-bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300
    outline outline-1 -outline-offset-1 outline-border-line overflow-hidden flex flex-col
  `;

  if (variant === 'reduced') {
    return (
      <div className={`${baseCardStyles} p-4 gap-4 ${className}`}>
        <div className="w-full flex justify-center py-2 text-brand-primary">
          <div className="[&>svg]:w-16 [&>svg]:h-16">{icon}</div>
        </div>
        
        <div className="w-full flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold font-sans text-text-main leading-tight truncate">{title}</h3>
            <span className="text-xs font-normal font-sans text-text-body">Click to play!</span>
          </div>
          <Button 
            variant="secondary" 
            icon={<Play size={16} className="fill-current" />} 
            onClick={onPlay}
            className="w-10 h-10 px-0 justify-center shrink-0" 
            aria-label={`Jugar ${title}`}
          />
        </div>
      </div>
    );
  }

  if (variant === 'normal') {
    return (
      <div className={`${baseCardStyles} p-5 gap-4 ${className}`}>
        <div className="w-full flex justify-center py-4 text-brand-primary">
          <div className="[&>svg]:w-20 [&>svg]:h-20">{icon}</div>
        </div>
        
        <div className="flex justify-start">
          <Badge variant="gray" label={category} withDot />
        </div>

        <div className="flex flex-col gap-1.5 min-h-22.5">
          <h3 className="text-lg font-bold font-sans text-text-main leading-tight">{title}</h3>
          <p className="text-sm font-normal font-sans text-text-muted line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="w-full flex justify-end pt-2 mt-auto">
          <Button 
            variant="secondary" 
            icon={<Play size={14} className="fill-current" />} 
            iconPosition="right"
            onClick={onPlay}
          >
            Play Demo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${baseCardStyles} relative 
      hover:-translate-y-1 transition-transform duration-300
      ${className}
    `}>
      {isHot && (
        <div className="absolute top-3 right-3 z-10 bg-state-error-subtle text-state-error px-2.5 py-1 rounded-full text-xs font-bold font-sans flex items-center gap-1 shadow-sm">
          <Flame size={12} className="fill-current" />
          HOT
        </div>
      )}

      <div className="w-full bg-brand-surface/50 p-6 flex flex-col items-center justify-center gap-3 border-b border-border-line">
        <IconWrapper icon={icon} variant="circle" theme="brand" className="w-16 h-16 [&>svg]:w-8 [&>svg]:h-8 shadow-sm" />
        
        <div className="flex items-center gap-1.5 text-brand-primary font-bold font-sans text-sm bg-white px-3 py-1 rounded-full shadow-sm">
          <Trophy size={14} />
          +{xpReward} XP
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold font-sans text-text-main leading-tight">{title}</h3>
          <p className="text-sm font-normal font-sans text-text-muted line-clamp-2">
            {description}
          </p>
        </div>

        {progress > 0 && (
          <div className="w-full flex flex-col gap-1.5">
            <div className="w-full flex justify-between text-xs font-medium font-sans text-text-body">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-bg-app rounded-full overflow-hidden">
              <div 
                className="h-full bg-state-success rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Button 
          variant="primary" 
          icon={<Play size={14} className="fill-current" />} 
          iconPosition="left"
          onClick={onPlay}
          className="w-full mt-2"
        >
          {progress > 0 ? 'Continuar Jugando' : 'Empezar a Jugar'}
        </Button>
      </div>

    </div>
  );
};