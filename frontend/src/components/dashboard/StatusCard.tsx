import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'border-border',
  info: 'border-info/30 bg-info/5',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  destructive: 'border-destructive/30 bg-destructive/5',
};

const iconStyles = {
  default: 'text-muted-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

export function StatusCard({ 
  title, 
  value, 
  unit, 
  icon, 
  variant = 'default' 
}: StatusCardProps) {
  return (
    <div className={cn(
      'industrial-card p-4 flex flex-col gap-2 border',
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        {icon && (
          <span className={cn(iconStyles[variant])}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="status-value">{value}</span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
}
