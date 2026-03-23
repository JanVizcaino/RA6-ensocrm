import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../ui/Button';

export interface GameData {
    id: number;
    name: string;
    description: string;
    path: string;
    is_published: boolean;
}

interface Props {
    game: GameData;
    onPlay: (game: GameData) => void;
}

export const GameCardPlayer: React.FC<Props> = ({ game, onPlay }) => {
    return (
        <div className="flex flex-col bg-bg-card rounded-xl outline-1 -outline-offset-1 outline-border-line shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            
            <div className="h-36 bg-brand-surface flex items-center justify-center">
                <Play size={40} className="text-brand-primary opacity-40" />
            </div>

            <div className="flex flex-col gap-3 p-4 flex-1">
                <div>
                    <h3 className="font-bold text-text-main text-sm leading-tight">{game.name}</h3>
                    {game.description && (
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{game.description}</p>
                    )}
                </div>

                <div className="mt-auto">
                    <Button
                        variant="primary"
                        icon={<Play size={14} />}
                        onClick={() => onPlay(game)}
                        className="w-full justify-center"
                    >
                        Jugar
                    </Button>
                </div>
            </div>
        </div>
    );
};