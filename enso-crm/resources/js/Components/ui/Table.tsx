import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', ...props }) => (
  <div className="w-full bg-bg-card rounded-lg outline -outline-offset-1 outline-border-line overflow-hidden">
    <div className="overflow-x-auto">
      <table className={`w-full table-fixed text-sm text-left ${className}`} {...props} />
    </div>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <thead className={`bg-bg-card text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border-line ${className}`} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <tbody className={`divide-y divide-border-line bg-bg-card ${className}`} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', ...props }) => (
  <tr className={`hover:bg-bg-app transition-colors duration-150 group ${className}`} {...props} />
);

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
}

export const TableHead: React.FC<TableHeadProps> = ({ className = '', children, sortable, ...props }) => (
  <th className={`px-6 py-3.5 font-medium align-middle truncate ${className}`} {...props}>
    <div className={`flex items-center gap-2 ${sortable ? 'cursor-pointer hover:text-text-main transition-colors' : ''}`}>
      {children}
      {sortable && <ChevronDown size={14} className="text-text-muted shrink-0" strokeWidth={2.5} />}
    </div>
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <td className={`px-6 py-3.5 align-middle text-text-main wrap-break-word min-w-0 ${className}`} {...props} />
);