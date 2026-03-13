import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';

interface HelpRequestWidgetProps {
  onRequestHelp?: () => Promise<void>; 
  className?: string;
}

export const HelpRequestWidget: React.FC<HelpRequestWidgetProps> = ({
  onRequestHelp,
  className = ''
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleClick = async () => {
    if (status !== 'idle') return;
    
    setStatus('loading');
    
    try {
      if (onRequestHelp) {
        await onRequestHelp();
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setStatus('success');
    } catch (error) {
      setStatus('idle'); 
    }
  };

  return (
    <div 
      className={`
        w-full max-w-2xl mx-auto p-8 sm:p-12
        bg-bg-card rounded-2xl shadow-sm
        outline -outline-offset-1 outline-border-line
        flex flex-col items-center justify-center text-center gap-8
        ${className}
      `}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={status !== 'idle'}
        aria-label={status === 'success' ? "Ayuda solicitada" : "Solicitar ayuda"}
        className={`
          group relative flex items-center justify-center
          w-32 h-32 rounded-full transition-all duration-500 ease-out
          focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30
          ${status === 'idle' ? 'cursor-pointer hover:bg-brand-surface hover:scale-105' : ''}
          ${status === 'success' ? 'bg-brand-surface scale-110' : ''}
        `}
      >
        {status === 'loading' ? (
          <Loader2 className="w-16 h-16 animate-spin text-brand-primary" />
        ) : (
          <Heart 
            strokeWidth={status === 'success' ? 3 : 2}
            className={`
              w-20 h-20 transition-all duration-500
              ${status === 'success' 
                ? 'text-brand-primary fill-brand-primary/20 scale-110' 
                : 'text-text-body group-hover:text-brand-primary'}
            `}
          />
        )}
        
        {status === 'idle' && (
          <div className="absolute inset-0 rounded-full bg-brand-primary opacity-0 group-hover:animate-ping group-hover:opacity-20 transition-opacity" />
        )}
      </button>

      <div className="flex flex-col gap-3 transition-all duration-300">
        {status === 'success' ? (
          <>
            <h3 className="text-3xl sm:text-4xl font-bold font-sans text-text-main tracking-tight">
              ¡Ayuda solicitada!
            </h3>
            <p className="text-lg sm:text-xl font-sans text-text-body">
              Nos pondremos en contacto contigo muy pronto. No estás solo/a.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-3xl sm:text-4xl font-bold font-sans text-text-main tracking-tight">
              ¿Necesitas hablar?
            </h3>
            <p className="text-lg sm:text-xl font-sans text-text-body">
              Pulsa en el corazón para solicitar ayuda.
            </p>
          </>
        )}
      </div>
      
    </div>
  );
};