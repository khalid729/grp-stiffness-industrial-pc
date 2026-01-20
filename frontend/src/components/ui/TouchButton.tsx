import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "success" | "destructive" | "warning" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      success: "bg-success text-success-foreground hover:bg-success/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      outline: "border-2 border-border bg-transparent hover:bg-secondary/50",
      ghost: "bg-transparent hover:bg-secondary/50",
    };

    const sizes = {
      sm: "min-h-[36px] px-3 text-xs",
      md: "min-h-[44px] px-4 text-sm",
      lg: "min-h-[52px] px-5 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
          "transition-all duration-150 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "touch-action-manipulation select-none",
          variants[variant],
          sizes[size],
          className
        )}
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

TouchButton.displayName = "TouchButton";
