import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ModeToggleProps {
  isRemote: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function ModeToggle({ isRemote, onChange, disabled = false }: ModeToggleProps) {
  const { t } = useLanguage();
  
  return (
    <div className={cn(
      "flex rounded-lg overflow-hidden border-2 border-border",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <button
        onClick={onChange}
        disabled={disabled || !isRemote}
        className={cn(
          "px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all min-w-[90px]",
          !isRemote
            ? "bg-mode-local text-mode-local-foreground shadow-[0_0_15px_hsl(var(--mode-local)/0.4)]"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
        )}
      >
        {t('mode.local')}
      </button>
      <button
        onClick={onChange}
        disabled={disabled || isRemote}
        className={cn(
          "px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all min-w-[90px]",
          isRemote
            ? "bg-mode-remote text-mode-remote-foreground shadow-[0_0_15px_hsl(var(--mode-remote)/0.4)]"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
        )}
      >
        {t('mode.remote')}
      </button>
    </div>
  );
}
