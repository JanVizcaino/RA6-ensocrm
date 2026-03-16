import React from 'react';

interface TableToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  filters,
  actions,
  className = ''
}) => {
  return (
    <div 
      className={`
        flex justify-between items-center w-full 
        px-6 py-3.5 
        bg-bg-card rounded-lg 
        outline-1 -outline-offset-1 outline-border-line 
        gap-4
        ${className}
      `}
    >
      <div className="flex items-center gap-4 flex-1">
        
        {search && (
          <div className="w-full max-w-sm">
            {search}
          </div>
        )}

        {filters && (
          <div className="flex items-center gap-3">
            {filters}
          </div>
        )}

      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
      
    </div>
  );
};