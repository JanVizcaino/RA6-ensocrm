import React from 'react';
import { Play, Package, Pencil } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconWrapper } from '../ui/IconWrapper';

export interface GameData {
  id: number;
  name: string;
  description: string;
  path: string;
  is_published: boolean;
}

interface GameCardProps {
  game: GameData;
  onEdit?: (game: GameData) => void;
  onPlay?: (game: GameData) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onEdit, onPlay }) => {
  return (
    <div className="w-full bg-bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 outline-1 -outline-offset-1 outline-border-line overflow-hidden flex flex-col p-5 gap-4">
      
      <div className="w-full flex justify-between items-start">
        <Badge 
          variant={game.is_published ? 'green' : 'gray'} 
          label={game.is_published ? 'Publicado' : 'Borrador'} 
          withDot 
        />
        <button 
          onClick={() => onEdit?.(game)}
          className="text-text-muted hover:text-brand-primary transition-colors p-1"
          aria-label="Editar juego"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="w-full flex justify-center py-2 text-brand-primary">
        <IconWrapper icon={<Package size={48} />} variant="transparent" />
      </div>

      <div className="flex flex-col gap-1.5 min-h-[80px]">
        <h3 className="text-lg font-bold font-sans text-text-main leading-tight truncate" title={game.name}>
          {game.name}
        </h3>
        <p className="text-sm font-normal font-sans text-text-muted line-clamp-3 leading-relaxed">
          {game.description || 'Sin descripción disponible.'}
        </p>
      </div>

      <div className="w-full flex justify-end pt-2 mt-auto border-t border-border-line">
        <Button 
          variant="secondary" 
          icon={<Play size={14} className="fill-current" />} 
          iconPosition="right"
          onClick={() => onPlay?.(game)}
          className="w-full justify-center mt-2"
        >
          Probar Demo
        </Button>
      </div>
    </div>
  );
};