import React from 'react';
import { LogLine, LogLineProps } from '../ui/LogLine';

interface SystemLogsPanelProps {
  logs: LogLineProps[]; 
  className?: string;
}

export const SystemLogsPanel: React.FC<SystemLogsPanelProps> = ({ 
  logs, 
  className = '' 
}) => {
  return (
    <div 
      className={`
        w-full sm:w-125 h-100 
        p-5 bg-bg-card rounded-lg shadow-sm 
        outline -outline-offset-1 outline-border-line
        flex flex-col gap-4 overflow-hidden
        ${className}
      `}
    >
      <h2 className="text-lg font-bold font-sans text-text-main tracking-tight shrink-0">
        System Logs
      </h2>

      <div className="flex-1 w-full bg-bg-app rounded-md p-4 overflow-y-auto outline -outline-offset-1 outline-border-line/50">
        
        <div className="flex flex-col gap-1">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <LogLine 
                key={index} 
                message={log.message}
                timestamp={log.timestamp}
                level={log.level} 
              />
            ))
          ) : (
            <div className="text-xs font-mono text-text-muted italic py-2">
              No recent logs found...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};