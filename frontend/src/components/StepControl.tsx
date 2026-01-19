import { useState, useEffect, useCallback } from 'react';
import { TouchButton } from '@/components/ui/TouchButton';
import { NumericKeypad, useNumericKeypad } from '@/components/ui/NumericKeypad';
import { ChevronUp, ChevronDown, Settings2 } from 'lucide-react';
import { useStepControl } from '@/hooks/useApi';
import { useLiveData } from '@/hooks/useLiveData';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function StepControl() {
  const { t } = useLanguage();
  const { liveData, isConnected } = useLiveData();
  const { setStepDistance, stepForward, stepBackward } = useStepControl();
  
  const [distance, setDistance] = useState<number>(10.0);

  // Numeric keypad hook
  const { openKeypad, keypadProps } = useNumericKeypad();

  // Get step and safety data from liveData
  const step = liveData.step || { distance: 0, active: false, done: false };
  const safety = liveData.safety || { ok: true, motion_allowed: true };
  const isLocalMode = !liveData.remote_mode && !(liveData.mode?.remote);

  // Sync distance from PLC on mount
  useEffect(() => {
    if (step.distance > 0) {
      setDistance(step.distance);
    }
  }, []);

  // Open distance keypad
  const handleOpenDistanceKeypad = useCallback(() => {
    if (step.active) return;
    openKeypad({
      initialValue: distance.toString(),
      title: t('step.distance') || 'Step Distance',
      min: 0.1,
      max: 100,
      unit: 'mm',
      onConfirm: (value) => {
        const dist = parseFloat(value);
        setDistance(dist);
        setStepDistance.mutate(dist);
      },
    });
  }, [distance, step.active, openKeypad, setStepDistance, t]);

  const handleStepUp = () => {
    stepBackward.mutate();
  };

  const handleStepDown = () => {
    stepForward.mutate();
  };

  const isDisabled = !isConnected || isLocalMode || step.active || !safety.ok;

  return (
    <div className="industrial-card p-4">
      <h3 className="text-sm lg:text-base font-semibold mb-4 text-foreground flex items-center gap-2">
        <Settings2 className="w-5 h-5" />
        {t('step.title') || 'Step Movement'}
      </h3>

      {/* Distance Input with Keypad */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground block mb-2">
          {t('step.distance') || 'Distance'}:
        </label>
        <button
          onClick={handleOpenDistanceKeypad}
          disabled={step.active}
          className={cn(
            "w-full p-3 rounded-xl border-2 border-border bg-secondary/30",
            "hover:bg-secondary/50 hover:border-primary/50 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          <span className="text-xl font-mono font-bold text-primary">
            {distance.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">mm</span>
        </button>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {t('manual.tapToEdit') || 'Tap to edit'} • Min: 0.1 | Max: 100 mm
        </p>
      </div>

      {/* Current PLC Distance */}
      <div className="text-xs text-muted-foreground mb-4 text-center">
        PLC: {step.distance?.toFixed(1) || '0.0'} mm
      </div>

      {/* Step Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <TouchButton
          variant="outline"
          size="lg"
          onClick={handleStepUp}
          disabled={isDisabled || stepBackward.isPending}
          className="flex flex-col items-center gap-1 h-20"
        >
          <ChevronUp className="w-8 h-8" />
          <span className="text-sm font-medium">{t('step.up') || 'STEP UP'}</span>
        </TouchButton>

        <TouchButton
          variant="outline"
          size="lg"
          onClick={handleStepDown}
          disabled={isDisabled || stepForward.isPending}
          className="flex flex-col items-center gap-1 h-20"
        >
          <ChevronDown className="w-8 h-8" />
          <span className="text-sm font-medium">{t('step.down') || 'STEP DOWN'}</span>
        </TouchButton>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className={cn(
          'w-3 h-3 rounded-full transition-colors',
          step.active && 'bg-yellow-500 animate-pulse',
          step.done && !step.active && 'bg-green-500',
          !step.active && !step.done && 'bg-muted-foreground/30'
        )} />
        <span className="text-sm text-muted-foreground">
          {step.active 
            ? (t('step.moving') || 'Moving...') 
            : step.done 
              ? (t('step.complete') || 'Complete') 
              : (t('step.ready') || 'Ready')}
        </span>
      </div>

      {/* Warnings */}
      {isLocalMode && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-600 dark:text-yellow-400 text-sm">
          {t('mode.localWarning') || 'System in LOCAL mode'}
        </div>
      )}
      
      {!safety.ok && (
        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          {t('step.safetyWarning') || 'Safety interlock active - Step disabled'}
        </div>
      )}

      {/* Numeric Keypad Modal */}
      <NumericKeypad {...keypadProps} />
    </div>
  );
}

export default StepControl;
