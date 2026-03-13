import React from 'react';
import { GameListItem } from '../shared/GameListItem';
import { SearchBar } from '../shared/SearchBar';
import { Card } from '../ui/Card';
import { Package, Brain, Puzzle } from 'lucide-react';

export interface GameOption {
  id: string | number;
  name: string;
  iconType?: 'box' | 'brain' | 'puzzle'; 
}

interface GameSelectorPanelProps {
  availableGames: GameOption[];
  onAddGame?: (gameId: string | number) => void;
  onOpenSearch?: () => void; 
  className?: string;
}

export const GameSelectorPanel: React.FC<GameSelectorPanelProps> = ({
  availableGames,
  onAddGame,
  onOpenSearch,
  className = ''
}) => {
  
  const renderIcon = (type?: string) => {
    switch (type) {
      case 'brain': return <Brain size={24} />;
      case 'puzzle': return <Puzzle size={24} />;
      default: return <Package size={24} />;
    }
  };

  return (
    <Card noPadding className={`w-full max-w-lg p-4 gap-4 ${className}`}>
      
      <SearchBar 
        variant="default" 
        onClick={onOpenSearch} 
      />

      <div className="flex flex-col gap-2.5 max-h-100 overflow-y-auto pr-1 w-full">
        
        {availableGames.length > 0 ? (
          availableGames.map((game) => (
            <GameListItem
              key={game.id}
              variant="reduced"
              title={game.name}
              icon={renderIcon(game.iconType)}
              onAdd={() => onAddGame?.(game.id)}
            />
          ))
        ) : (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center gap-2">
            <Package size={32} className="text-text-muted/50" />
            <span className="text-sm font-medium font-sans text-text-muted">
              No games available.
            </span>
          </div>
        )}

      </div>
    </Card>
  );
};