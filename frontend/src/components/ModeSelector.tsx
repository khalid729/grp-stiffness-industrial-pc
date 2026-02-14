import { Wrench, Monitor, AlertTriangle, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  remoteMode: boolean;
  onModeChange: (mode: boolean) => void;
  isDisabled?: boolean;
  isTestRunning?: boolean;
  isMoving?: boolean;
  variant?: 'full' | 'compact';
}

export function ModeSelector({
  remoteMode,
  onModeChange,
  isDisabled = false,
  isTestRunning = false,
  isMoving = false,
  variant = 'full',
}: ModeSelectorProps) {
  const { t } = useLanguage();
  
  const isLocked = isTestRunning || isMoving || isDisabled;
  const isLocalMode = !remoteMode;

  const handleModeChange = (newRemoteMode: boolean) => {
    if (!isLocked) {
      onModeChange(newRemoteMode);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">
          {t('mode.label')}
        </span>
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => handleModeChange(false)}
            disabled={isLocked}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all touch-none',
              'min-w-[100px] justify-center',
              isLocalMode
                ? 'bg-mode-local text-mode-local-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Wrench className="w-4 h-4" />
            {t('mode.local')}
          </button>
          <button
            onClick={() => handleModeChange(true)}
            disabled={isLocked}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all touch-none',
              'min-w-[100px] justify-center',
              remoteMode
                ? 'bg-mode-remote text-mode-remote-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Monitor className="w-4 h-4" />
            {t('mode.remote')}
          </button>
        </div>
        {isLocalMode && (
          <span className="mode-pill mode-pill-local text-xs">
            {t('mode.local')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="industrial-card p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t('mode.title')}</h3>
        <span className={cn(
          'mode-pill',
          isLocalMode ? 'mode-pill-local' : 'mode-pill-remote'
        )}>
          {isLocalMode ? t('mode.local') : t('mode.remote')}
        </span>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* LOCAL Mode */}
        <button
          onClick={() => handleModeChange(false)}
          disabled={isLocked}
          className={cn(
            'mode-card mode-card-local touch-none',
            isLocalMode && 'active',
            isLocked && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Wrench className={cn(
            'w-10 h-10 md:w-12 md:h-12',
            isLocalMode ? 'text-mode-local' : 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-lg md:text-xl font-bold',
            isLocalMode ? 'text-mode-local' : 'text-foreground'
          )}>
            {t('mode.local')}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">
            {t('mode.localDesc')}
          </span>
        </button>

        {/* REMOTE Mode */}
        <button
          onClick={() => handleModeChange(true)}
          disabled={isLocked}
          className={cn(
            'mode-card mode-card-remote touch-none',
            remoteMode && 'active',
            isLocked && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Monitor className={cn(
            'w-10 h-10 md:w-12 md:h-12',
            remoteMode ? 'text-mode-remote' : 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-lg md:text-xl font-bold',
            remoteMode ? 'text-mode-remote' : 'text-foreground'
          )}>
            {t('mode.remote')}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">
            {t('mode.remoteDesc')}
          </span>
        </button>
      </div>

      {/* Warnings */}
      {isLocalMode && (
        <div className="warning-banner">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{t('mode.localWarning')}</span>
        </div>
      )}

      {isLocked && isTestRunning && (
        <div className="warning-banner">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{t('mode.locked')}</span>
        </div>
      )}

      {/* Safety Note */}
      <div className="safety-note">
        <Zap className="w-4 h-4 text-warning" />
        <span>{t('mode.safetyNote')}</span>
      </div>
    </div>
  );
}
