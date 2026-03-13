import React from 'react';
import { Reply, Share, Trash2, Star } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface MessageDetailProps {
  senderName: string;
  senderEmail: string;
  date: string;
  content: string;
}

export const MessageDetail: React.FC<MessageDetailProps> = ({
  senderName,
  senderEmail,
  date,
  content
}) => {
  return (
    <div className="w-full bg-bg-card rounded-lg shadow-sm outline -outline-offset-1 outline-border-line p-6 flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        
        <div className="flex items-center gap-4">
          <Avatar size="lg" />
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl text-text-main font-sans">{senderName}</h2>
            <span className="text-lg text-text-muted font-sans">{senderEmail}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={<Reply size={16} strokeWidth={2.5} />} iconPosition="left">
            Reply
          </Button>
          <Button variant="secondary" icon={<Share size={16} strokeWidth={2.5} />} iconPosition="right">
            Forward
          </Button>
        </div>
        
      </div>

      <div className="text-base text-text-main font-sans leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      <div className="flex justify-between items-center border-t border-border-line pt-4 mt-4">
        <span className="text-text-main font-sans text-sm">{date}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" icon={<Trash2 size={18} />} />
          <Button variant="ghost" icon={<Star size={18} />} />
        </div>
      </div>

    </div>
  );
};