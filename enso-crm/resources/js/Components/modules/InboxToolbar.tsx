import React from 'react';
import { Pencil, Inbox, Star, Send, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

export type InboxTab = 'inbox' | 'starred' | 'sent' | 'trash';

interface InboxToolbarProps {
  activeTab?: InboxTab;
  onTabChange?: (tab: InboxTab) => void;
  onCompose?: () => void;
  className?: string;
}

export const InboxToolbar: React.FC<InboxToolbarProps> = ({
  activeTab = 'inbox',
  onTabChange,
  onCompose,
  className = ''
}) => {
  
  const getTabClass = (tab: InboxTab) => {
    return activeTab === tab
      ? 'bg-brand-surface text-brand-primary' 
      : 'text-text-body';                    
  };

  return (
    <div 
      className={`
        w-full px-4 py-2.5 
        bg-bg-card rounded-md 
        outline -outline-offset-1 outline-border-line 
        flex items-center gap-6 
        ${className}
      `}
    >
      <Button 
        icon={<Pencil size={16} strokeWidth={2.5} />} 
        iconPosition="left"
        onClick={onCompose}
      >
        New
      </Button>

      <div className="w-px h-6 bg-border-line" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          icon={<Inbox size={18} />}
          onClick={() => onTabChange?.('inbox')}
          className={getTabClass('inbox')}
          aria-label="Bandeja de entrada"
        />
        
        <Button
          variant="ghost"
          icon={<Star size={18} />}
          onClick={() => onTabChange?.('starred')}
          className={getTabClass('starred')}
          aria-label="Destacados"
        />
        
        <Button
          variant="ghost"
          icon={<Send size={18} />}
          onClick={() => onTabChange?.('sent')}
          className={getTabClass('sent')}
          aria-label="Enviados"
        />
        
        <Button
          variant="ghost"
          icon={<Trash2 size={18} />}
          onClick={() => onTabChange?.('trash')}
          className={getTabClass('trash')}
          aria-label="Papelera"
        />
      </div>
      
    </div>
  );
};