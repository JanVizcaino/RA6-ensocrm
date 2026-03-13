import React from 'react';
import { Card } from '../ui/Card';
import { IconWrapper, IconTheme } from '../ui/IconWrapper';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string; 
  trendColor?: 'default' | 'green' | 'red'; 
  theme?: IconTheme;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend,
  trendColor = 'default',
  theme = 'brand',
  className = ''
}) => {
  
  const trendStyles = {
    default: "text-text-muted",
    green: "text-state-success",
    red: "text-state-error"
  };

  return (
    <Card className={`w-full sm:w-64 h-36 justify-between ${className}`}>
      
      <IconWrapper 
        icon={icon} 
        theme={theme} 
        variant="circle" 
      />

      <span className="text-text-body text-base font-normal font-sans">
        {title}
      </span>

      <div className="self-stretch inline-flex justify-start items-baseline gap-2">
        <span className="text-text-main text-3xl font-normal font-sans tracking-tight">
          {value}
        </span>
        
        {trend && (
          <span className={`text-xs font-normal font-sans ${trendStyles[trendColor]}`}>
            {trend}
          </span>
        )}
      </div>

    </Card>
  );
};