import { cn } from '@/lib/utils';

interface MachineIndicatorProps {
  label: string;
  isActive: boolean;
  isError?: boolean;
}

export function MachineIndicator({ 
  label, 
  isActive, 
  isError = false 
}: MachineIndicatorProps) {
  return (
    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
      <div className={cn(
        'status-light',
        isError && isActive 
          ? 'status-light-error' 
          : isActive 
            ? 'status-light-active' 
            : 'status-light-inactive'
      )} />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}
