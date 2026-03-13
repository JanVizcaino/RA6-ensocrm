import React from 'react';
import { Play, Pencil, Trash2, Library } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export type Stage = 'eso' | 'fp' | 'brand';

interface CollectionCardProps {
  title: string;
  description: string;
  stages: Stage[]; 
  icon?: React.ReactNode;
  
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  
  className?: string;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  description,
  stages = [],
  icon = <Library size={48} />, 
  onPlay,
  onEdit,
  onDelete,
  className = ''
}) => {
  
  const getBadgeVariant = (stage: Stage) => {
    switch (stage) {
      case 'eso': return 'green'; 
      case 'fp': return 'blue';   
      default: return 'blue';    
    }
  };

  return (
    <div 
      className={`
        w-full bg-bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300
        outline -outline-offset-1 outline-border-line 
        overflow-hidden flex flex-col p-5 gap-4
        ${className}
      `}
    >
      <div className="w-full flex justify-center py-2 text-brand-primary">
        <div className="[&>svg]:w-20 [&>svg]:h-20">{icon}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <Badge 
            key={stage}
            variant={getBadgeVariant(stage)} 
            label={stage.toUpperCase()} 
            withDot 
          />
        ))}
        {stages.length === 0 && <div className="h-5" />}
      </div>

      <div className="flex flex-col gap-1.5 min-h-22.5">
        <h3 className="text-lg font-bold font-sans text-text-main leading-tight">
          {title}
        </h3>
        <p className="text-sm font-normal font-sans text-text-muted line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="w-full flex justify-end gap-2 pt-2 mt-auto">
        {onDelete && (
          <Button 
            variant="secondary" 
            icon={<Trash2 size={16} />} 
            onClick={onDelete}
            aria-label="Borrar colección"
            className="w-10 h-10 px-0 justify-center text-state-error hover:bg-state-error-subtle hover:text-state-error border-state-error/30"
          />
        )}
        
        {onEdit && (
          <Button 
            variant="secondary" 
            icon={<Pencil size={16} />} 
            onClick={onEdit}
            aria-label="Editar colección"
            className="w-10 h-10 px-0 justify-center"
          />
        )}
        
        {onPlay && (
          <Button 
            variant="secondary" 
            icon={<Play size={16} className="fill-current" />} 
            onClick={onPlay}
            aria-label="Jugar colección"
            className="w-10 h-10 px-0 justify-center"
          />
        )}
      </div>
    </div>
  );
};