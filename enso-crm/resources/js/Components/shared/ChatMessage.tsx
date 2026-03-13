import React from 'react';
import { CheckCheck } from 'lucide-react'; 
interface ChatMessageProps {
  message: string;
  time: string;
  isOwn?: boolean;       
  isFirst?: boolean;      
  senderName?: string;    
  senderInitials?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  time,
  isOwn = false,
  isFirst = false,
  senderName,
  senderInitials
}) => {
  const bubbleColor = isOwn 
    ? 'bg-brand-primary text-white shadow-sm' 
    : 'bg-bg-card text-text-main shadow-sm outline outline-1 -outline-offset-1 outline-border-line';

  let borderRadius = 'rounded-2xl'; 
  
  if (isFirst) {
    borderRadius = isOwn 
      ? 'rounded-2xl rounded-tr-sm' 
      : 'rounded-2xl rounded-tl-sm';
  }

  return (
    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      
      <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {!isOwn && (
          <div className="w-8 shrink-0 flex flex-col items-center justify-end pb-1">
            {isFirst ? (
              <div 
                className="w-8 h-8 bg-bg-app rounded-full flex items-center justify-center outline -outline-offset-1 outline-border-line"
                aria-hidden="true"
              >
                <span className="text-text-body text-xs font-medium font-sans uppercase">
                  {senderInitials}
                </span>
              </div>
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-0">
          
          {!isOwn && isFirst && senderName && (
            <span className="text-sm font-semibold font-sans text-text-main ml-1">
              {senderName}
            </span>
          )}

          <div className={`px-4 py-2.5 flex flex-col gap-1 ${bubbleColor} ${borderRadius}`}>
            
            <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap wrap-break-word">
              {message}
            </p>

            <div 
              className={`
                flex items-center justify-end gap-1.5 text-[11px] font-sans
                ${isOwn ? 'text-brand-surface/80' : 'text-text-muted'}
              `}
            >
              <span>{time}</span>
              {isOwn && <CheckCheck size={14} strokeWidth={2.5} />}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};