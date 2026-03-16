import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode; 
  description?: string;
  headerTabs?: React.ReactNode; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | 'xxl' | 'custom'; 
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  description,
  headerTabs, 
  children,
  footer,
  width = 'md',
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const widthClass = {
    md: 'max-w-md',     
    lg: 'max-w-lg',     
    xl: 'max-w-xl',
    xxl: 'max-w-2xl',     
    custom: 'max-w-[560px]' 
  }[width];

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden pointer-events-none`}>
      
      <div 
        className="absolute inset-0 bg-text-main/40 backdrop-blur-sm transition-opacity pointer-events-auto animate-in fade-in duration-300" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        
        <div className={`w-screen ${widthClass} pointer-events-auto`}>
          <div className="flex flex-col h-full bg-bg-card shadow-2xl animate-in slide-in-from-right duration-300 outline-1 -outline-offset-1 outline-border-line">
            
            <div className="flex flex-col border-b border-border-line bg-bg-card z-10 shrink-0">
              <div className="flex items-start justify-between px-6 py-6">
                <div className="flex-1">
                  <div className="text-xl font-bold font-sans text-text-main tracking-tight">
                    {title}
                  </div>
                  {description && (
                    <p className="mt-1 text-sm font-sans text-text-body leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <div className="flex items-center ml-3 h-7 shrink-0">
                  <button
                    type="button"
                    className="p-2 -m-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-app"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {headerTabs && (
                 <div className="px-6 pb-2">
                    {headerTabs}
                 </div>
              )}
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto bg-bg-app">
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-line bg-bg-card shrink-0">
                {footer}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};