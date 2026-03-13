import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatHeaderProps {
  name: string;
  status: string;
  initials: string;
  onActionClick?: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  status,
  initials,
  onActionClick,
  className = ''
}) => {
  return (
    <div 
      className={`
        w-full px-4 py-3 
        bg-bg-card border-b border-border-line 
        flex justify-between items-center gap-4
        ${className}
      `}
    >
      <div 
        className="w-10 h-10 bg-bg-app rounded-full flex items-center justify-center shrink-0 outline -outline-offset-1 outline-border-line"
        aria-hidden="true"
      >
        <span className="text-text-body text-sm font-medium font-sans tracking-wide uppercase">
          {initials}
        </span>
      </div>

      <div className="flex flex-col justify-center items-center gap-0.5 flex-1 min-w-0">
        <h2 className="text-text-main text-sm font-semibold font-sans truncate w-full text-center">
          {name}
        </h2>
        <span className="text-text-muted text-xs font-normal font-sans truncate w-full text-center">
          {status}
        </span>
      </div>

      <div className="shrink-0 flex items-center justify-end w-10">
        <Button 
          variant="ghost" 
          icon={<MoreHorizontal size={20} strokeWidth={2.5} />} 
          onClick={onActionClick}
          aria-label="Opciones del chat"
          className="w-10 h-10 px-0 justify-center text-text-body" 
        />
      </div>
    </div>
  );
};