import React from 'react';
import { Trash2, Star } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface InboxListItemProps {
  senderEmail: string;
  time: string;
  preview: string;
  isStarred?: boolean;
  isActive?: boolean; 
  onClick?: () => void;
}

export const InboxListItem: React.FC<InboxListItemProps> = ({
  senderEmail,
  time,
  preview,
  isStarred,
  isActive,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg cursor-pointer transition-colors duration-200
        outline -outline-offset-1 
        ${isActive 
          ? 'bg-brand-surface outline-brand-primary' 
          : 'bg-bg-card outline-border-line hover:bg-bg-app'}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-text-main font-sans text-sm truncate">{senderEmail}</span>
            <span className="text-text-muted font-sans text-xs">{time}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" icon={<Trash2 size={16} />} className="w-8 h-8 px-0" />
          <Button 
            variant="ghost" 
            icon={<Star size={16} className={isStarred ? 'fill-state-warning text-state-warning' : ''} />} 
            className="w-8 h-8 px-0" 
          />
        </div>
      </div>
      
      <p className="text-sm font-sans text-text-body leading-relaxed line-clamp-2">
        {preview}
      </p>
    </div>
  );
};