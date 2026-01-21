import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  variant?: "default" | "info" | "warning" | "success" | "destructive";
  compact?: boolean;
  actionButton?: ReactNode;
}

export function StatusCard({ 
  title, 
  value, 
  unit, 
  icon, 
  variant = "default",
  compact = false,
  actionButton,
}: StatusCardProps) {
  const variantStyles = {
    default: "border-border",
    info: "border-info/30 bg-info/5",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
    destructive: "border-destructive/30 bg-destructive/5",
  };

  const valueStyles = {
    default: "text-foreground",
    info: "text-info",
    warning: "text-warning",
    success: "text-success",
    destructive: "text-destructive",
  };

  if (compact) {
    return (
      <div className={cn(
        "industrial-card border p-3 flex flex-col min-h-[128px]",
        variantStyles[variant]
      )}>
        <div className="flex items-center justify-between gap-1 h-7 shrink-0">
          <div className="flex items-center gap-1 flex-1">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <p className="text-sm text-muted-foreground truncate">{title}</p>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>
        <div className="flex items-center gap-1 flex-1">
          <span className={cn("status-value text-4xl font-bold", valueStyles[variant])}>
            {value}
          </span>
          {unit && <span className="text-base text-muted-foreground">{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "industrial-card border p-3",
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className={cn("status-value text-3xl font-bold", valueStyles[variant])}>
            {value}
          </span>
          {unit && <span className="text-base text-muted-foreground">{unit}</span>}
        </div>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>
    </div>
  );
}
