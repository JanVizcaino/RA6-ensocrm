import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button'; // ¡Inyectamos nuestro Átomo!

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange,
  className = ''
}) => {
  
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  const isFirstPage = currentPage <= 1;
  const isLastPage = endItem >= totalItems || totalItems === 0;

  return (
    <div className={`w-full px-6 py-3 bg-bg-card border-t border-border-line flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      
      <div className="text-xs text-text-body font-sans text-center sm:text-left">
        Showing <span className="font-bold text-text-main">{startItem}</span> to <span className="font-bold text-text-main">{endItem}</span> of <span className="font-bold text-text-main">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        
        <Button
          variant="ghost"
          icon={<ChevronLeft size={14} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="Página anterior"
          className="outline -outline-offset-1 outline-border-line h-10 px-4 bg-bg-card hover:bg-bg-app disabled:bg-bg-app/50"
        >
          Previous
        </Button>

        <Button
          variant="ghost"
          icon={<ChevronRight size={14} strokeWidth={2.5} />}
          iconPosition="right"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="Página siguiente"
          className="outline -outline-offset-1 outline-border-line h-10 px-4 bg-bg-card hover:bg-bg-app disabled:bg-bg-app/50"
        >
          Next
        </Button>

      </div>
    </div>
  );
};