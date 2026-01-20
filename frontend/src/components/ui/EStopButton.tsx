import * as React from "react";
import { cn } from "@/lib/utils";
import { OctagonX } from "lucide-react";

interface EStopButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  label?: string;
  activeLabel?: string;
}

export const EStopButton = React.forwardRef<HTMLButtonElement, EStopButtonProps>(
  ({ className, isActive = false, label = "E-STOP", activeLabel = "ACTIVE", onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "w-28 h-28 rounded-full",
          "bg-gradient-to-b from-red-500 to-red-700",
          "border-4 border-red-400",
          "shadow-[0_4px_0_0_#7f1d1d,0_8px_20px_rgba(239,68,68,0.5)]",
          "active:translate-y-1 active:shadow-[0_2px_0_0_#7f1d1d,0_4px_10px_rgba(239,68,68,0.4)]",
          "transition-all duration-100",
          "e-stop-button",
          isActive && "animate-pulse bg-gradient-to-b from-red-600 to-red-800",
          className
        )}
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        {...props}
      >
        <OctagonX className="w-10 h-10 text-white drop-shadow-lg" />
        <span className="text-sm font-bold text-white mt-1 drop-shadow">
          {isActive ? activeLabel : label}
        </span>
      </button>
    );
  }
);

EStopButton.displayName = "EStopButton";
