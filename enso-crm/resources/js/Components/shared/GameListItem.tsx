import React, { useState } from 'react';
import { Package, Plus, ChevronDown, ChevronUp, Trash2, Save, Trophy, Clock, Gauge } from 'lucide-react';
import { Button } from '../ui/Button';

export type GameListVariant = 'reduced' | 'normal';

interface GameListItemProps {
  variant?: GameListVariant;
  title: string;
  icon?: React.ReactNode;

  initialDifficulty?: 'Baja' | 'Media' | 'Alta';
  initialRange?: [number, number];
  initialDuration?: number;
  initialXP?: number;
  
  onAdd?: () => void; 
  onSave?: (data: any) => void;
  onDelete?: () => void;
}

export const GameListItem: React.FC<GameListItemProps> = ({
  variant = 'normal',
  title,
  icon = <Package size={40} />,
  initialDifficulty = 'Media',
  initialRange = [5, 15],
  initialDuration = 60,
  initialXP = 50,
  onAdd,
  onSave,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [difficulty, setDifficulty] = useState(initialDifficulty);

  const baseStyles = "w-full bg-bg-card rounded-xl shadow-sm outline  -outline-offset-1 outline-border-line overflow-hidden transition-all duration-300";

  const Header = (
    <div className="w-full p-4 flex justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="text-brand-primary bg-brand-surface p-2 rounded-lg">
          {icon}
        </div>
        <h3 className="text-base font-bold font-sans text-text-main">{title}</h3>
      </div>

      {variant === 'reduced' ? (
        <Button 
          variant="secondary" 
          icon={<Plus size={18} />} 
          onClick={onAdd}
          className="w-10 h-10 px-0 justify-center"
        />
      ) : (
        <Button 
          variant="secondary" 
          icon={isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />} 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 px-0 justify-center"
        />
      )}
    </div>
  );

  if (variant === 'reduced') {
    return <div className={baseStyles}>{Header}</div>;
  }

  return (
    <div className={`${baseStyles} ${isExpanded ? 'shadow-md' : ''}`}>
      {Header}

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-border-line bg-bg-app/20 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-text-body flex items-center gap-2">
                <Gauge size={14} /> Dificultad
              </label>
              <div className="bg-bg-app p-1 rounded-lg flex gap-1">
                {['Baja', 'Media', 'Alta'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl as any)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
                      difficulty === lvl 
                      ? 'bg-bg-card text-text-main shadow-sm font-bold' 
                      : 'text-text-muted hover:text-text-body'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-text-body">Rango (min - max)</label>
              <div className="flex items-center gap-4 h-10 px-2 bg-bg-card rounded-lg outline  outline-border-line">
                <input type="number" defaultValue={initialRange[0]} className="w-12 text-center text-sm bg-transparent outline-none" />
                <div className="flex-1 h-1.5 bg-brand-surface rounded-full relative">
                  <div className="absolute left-1/4 right-1/4 h-full bg-brand-primary rounded-full" />
                </div>
                <input type="number" defaultValue={initialRange[1]} className="w-12 text-center text-sm bg-transparent outline-none" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-text-body flex items-center gap-2">
                <Clock size={14} /> Duración
              </label>
              <div className="flex outline  outline-border-line rounded-lg overflow-hidden h-10">
                <input type="number" defaultValue={initialDuration} className="flex-1 px-3 text-sm outline-none" />
                <span className="bg-bg-app px-3 flex items-center text-xs text-text-muted border-l border-border-line font-mono">SEG</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-text-body flex items-center gap-2">
                <Trophy size={14} className="text-brand-primary" /> Recompensa XP
              </label>
              <div className="flex outline  outline-border-line rounded-lg overflow-hidden h-10">
                <input type="number" defaultValue={initialXP} className="flex-1 px-3 text-sm outline-none font-bold text-brand-primary" />
                <span className="bg-brand-surface px-3 flex items-center text-xs text-brand-primary font-bold">XP</span>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-line/50">
            <Button 
              variant="secondary" 
              icon={<Trash2 size={16} />} 
              onClick={onDelete}
              className="text-state-error border-state-error/20 hover:bg-state-error-subtle"
            >
              Delete
            </Button>
            <Button 
              variant="primary" 
              icon={<Save size={16} />} 
              onClick={() => onSave?.({ difficulty, initialRange, initialDuration, initialXP })}
            >
              Save Changes
            </Button>
          </div>

        </div>
      )}
    </div>
  );
};