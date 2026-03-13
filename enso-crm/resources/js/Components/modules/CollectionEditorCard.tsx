import React, { useState } from 'react';
import { Pencil, Plus, Save, X, Search, Package, Brain } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';
import { SearchBar } from '../shared/SearchBar';
import { GameListItem } from '../shared/GameListItem';

import { Tag } from '../ui/Tag'; 

interface CollectionData {
  title: string;
  description: string;
  tags: string[];
  groups: string[];
  games: any[]; 
}

interface CollectionEditorCardProps {
  initialData: CollectionData;
  onSave?: (data: CollectionData) => void;
  className?: string;
}

export const CollectionEditorCard: React.FC<CollectionEditorCardProps> = ({
  initialData,
  onSave,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<CollectionData>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = data.games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSave?.(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setData(initialData);
    setIsEditing(false);
  };

  const removeTag = (tagToRemove: string) => {
    setData({ ...data, tags: data.tags.filter(t => t !== tagToRemove) });
  };

  const removeGroup = (groupToRemove: string) => {
    setData({ ...data, groups: data.groups.filter(g => g !== groupToRemove) });
  };

  return (
    <Card className={`w-full max-w-2xl flex flex-col gap-8 ${className}`}>
      
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <Badge variant="blue" label="Colección" withDot={false} />
          
          {!isEditing ? (
            <Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setIsEditing(true)}>
              Editar Info
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" icon={<X size={16} />} onClick={handleCancel}>Cancelar</Button>
              <Button variant="primary" icon={<Save size={16} />} onClick={handleSave}>Guardar</Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <TextInput 
              label="Título de la Colección" 
              value={data.title} 
              onChange={(e) => setData({ ...data, title: e.target.value })} 
            />
            <TextArea 
              label="Descripción" 
              value={data.description} 
              rows={4}
              onChange={(e) => setData({ ...data, description: e.target.value })} 
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold font-sans text-text-main tracking-tight">
              {data.title}
            </h2>
            <p className="text-sm font-sans text-text-body leading-relaxed">
              {data.description}
            </p>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border-line" />

      <div className="w-full bg-bg-app rounded-xl p-5 flex flex-col sm:flex-row gap-6">
        
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium font-sans text-text-main">Asignar a Clases</h3>
            {isEditing && <Button variant="ghost" icon={<Plus size={14} />} className="h-6 px-2 text-xs">Añadir</Button>}
          </div>
          <div className="flex flex-wrap gap-2 bg-bg-card p-3 rounded-lg outline -outline-offset-1 outline-border-line min-h-15">
            {data.groups.map(group => (
              <Badge 
                key={group} 
                variant="green" 
                label={group} 
                className={isEditing ? "cursor-pointer hover:bg-state-error-subtle hover:text-state-error" : ""}
                onClick={() => isEditing && removeGroup(group)}
                title={isEditing ? "Clic para eliminar" : ""}
              />
            ))}
            {data.groups.length === 0 && <span className="text-xs text-text-muted m-auto">No hay clases asignadas</span>}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium font-sans text-text-main">Etiquetas (Tags)</h3>
            {isEditing && <Button variant="ghost" icon={<Plus size={14} />} className="h-6 px-2 text-xs">Nuevo Tag</Button>}
          </div>
          <div className="flex flex-wrap gap-2 bg-bg-card p-3 rounded-lg outline -outline-offset-1 outline-border-line min-h-15">
            {data.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="blue" 
                label={`#${tag}`} 
                className={isEditing ? "cursor-pointer hover:bg-state-error-subtle hover:text-state-error" : ""}
                onClick={() => isEditing && removeTag(tag)}
                title={isEditing ? "Clic para eliminar" : ""}
              />
            ))}
            {data.tags.length === 0 && <span className="text-xs text-text-muted m-auto">Sin etiquetas</span>}
          </div>
        </div>

      </div>

      <div className="w-full flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-medium font-sans text-text-main">
            Juegos en esta colección ({data.games.length})
          </h3>
          <div className="w-full sm:w-64">
            <SearchBar 
              variant="compact" 
              placeholder="Buscar juego..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 max-h-125 overflow-y-auto pr-2">
          {filteredGames.length > 0 ? (
            filteredGames.map((game, idx) => (
              <GameListItem
                key={idx}
                variant="normal" 
                title={game.name}
                icon={game.iconType === 'brain' ? <Brain size={32} /> : <Package size={32} />}
                initialXP={game.xp}
                initialDifficulty={game.difficulty}
                onDelete={() => console.log('Borrar juego', game.id)}
                onSave={(gameData) => console.log('Guardar config del juego', gameData)}
              />
            ))
          ) : (
            <div className="w-full py-10 flex flex-col items-center justify-center text-text-muted bg-bg-app rounded-xl border border-dashed border-border-line">
              <Search size={24} className="mb-2 opacity-50" />
              <p className="text-sm">No se encontraron juegos.</p>
            </div>
          )}
        </div>
        
        {isEditing && (
          <Button 
            variant="secondary" 
            icon={<Plus size={16} />} 
            className="w-full border-dashed border-2 hover:bg-brand-surface"
          >
            Añadir nuevo juego a la colección
          </Button>
        )}

      </div>

    </Card>
  );
};