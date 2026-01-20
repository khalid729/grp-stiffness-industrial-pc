import { cn } from "@/lib/utils";

interface MachineIndicatorProps {
  label: string;
  isActive: boolean;
  isError?: boolean;
  size?: "sm" | "md";
}

export function MachineIndicator({ 
  label, 
  isActive, 
  isError = false,
  size = "sm"
}: MachineIndicatorProps) {
  const sizeClasses = {
    sm: "text-[10px] gap-1.5",
    md: "text-xs gap-2",
  };

  const lightSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
  };

  return (
    <div className={cn(
      "flex items-center px-2 py-1 rounded bg-secondary/30",
      sizeClasses[size]
    )}>
      <span 
        className={cn(
          "rounded-full flex-shrink-0",
          lightSizes[size],
          isError 
            ? "status-light-error" 
            : isActive 
              ? "status-light-active" 
              : "status-light-inactive"
        )} 
      />
      <span className="text-muted-foreground truncate">{label}</span>
    </div>
  );
}
