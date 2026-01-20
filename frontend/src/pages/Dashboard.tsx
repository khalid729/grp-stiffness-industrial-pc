import { useState, useEffect, useCallback, useRef } from 'react';
import { ForceDeflectionChart } from '@/components/dashboard/ForceDeflectionChart';
import { TouchButton } from '@/components/ui/TouchButton';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { 
  Home, Play, Square, 
  ChevronUp, ChevronDown, Lock, Unlock, Power, PowerOff, RotateCcw
} from 'lucide-react';
import { useLiveData, useJogControl } from '@/hooks/useLiveData';
import { useStepControl } from '@/hooks/useStepControl';
import { useCommands, useServoControl, useClampControl } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { t } = useLanguage();
  const { liveData, setLiveData, isConnected } = useLiveData();
  const { startTest, stopTest, goHome } = useCommands();
  const { enableServo, disableServo, resetAlarm } = useServoControl();
  const { lockUpper, lockLower, unlockAll } = useClampControl();
  const { jogForward, jogBackward, setJogSpeed, jogSpeed } = useJogControl();
  const { stepUp, stepDown, stepDistance, setStepDistance } = useStepControl();

  const [chartData, setChartData] = useState<{ deflection: number; force: number }[]>([]);
  const [isJogging, setIsJogging] = useState<'up' | 'down' | null>(null);
  const jogUpActive = useRef(false);
  const jogDownActive = useRef(false);

  // Keypad state
  const [keypadOpen, setKeypadOpen] = useState<'speed' | 'distance' | null>(null);

  const isLocalMode = !liveData.remote_mode;
  const controlsDisabled = isLocalMode || !isConnected;
  const isTestRunning = liveData.test_status === 2;
  const forceN = (liveData.actual_force || 0) * 1000;
  
  const safety = liveData.safety || {
    ok: true,
  };

  // Global jog release
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (jogUpActive.current) {
        jogUpActive.current = false;
        setIsJogging(null);
        jogBackward(false);
      }
      if (jogDownActive.current) {
        jogDownActive.current = false;
        setIsJogging(null);
        jogForward(false);
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [jogForward, jogBackward]);

  // Chart data update
  useEffect(() => {
    if (isTestRunning) {
      setChartData(prev => [...prev, {
        deflection: liveData.actual_deflection,
        force: forceN,
      }]);
    } else if (liveData.test_status === 1) {
      setChartData([]);
    }
  }, [liveData.actual_deflection, forceN, isTestRunning, liveData.test_status]);

  const handleStartTest = () => {
    setChartData([]);
    setLiveData(prev => ({ ...prev, test_status: 2 }));
    startTest.mutate();
  };

  const handleStop = () => {
    setLiveData(prev => ({ ...prev, test_status: 0 }));
    stopTest.mutate();
  };

  const handleJogUpStart = useCallback((e: React.PointerEvent) => {
    if (controlsDisabled || jogUpActive.current) return;
    e.preventDefault();
    jogUpActive.current = true;
    setIsJogging('up');
    jogBackward(true);
  }, [jogBackward, controlsDisabled]);

  const handleJogDownStart = useCallback((e: React.PointerEvent) => {
    if (controlsDisabled || jogDownActive.current) return;
    e.preventDefault();
    jogDownActive.current = true;
    setIsJogging('down');
    jogForward(true);
  }, [jogForward, controlsDisabled]);

  // Button height class for consistency
  const btnHeight = "h-12";

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up">
      {/* Control Groups - Horizontal Layout - Equal Width */}
      <div className="grid grid-cols-5 gap-2">
        {/* Group 1: Test Control */}
        <div className="flex flex-col gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">Test</span>
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() => goHome.mutate()}
            disabled={controlsDisabled || goHome.isPending}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">{t('actions.home')}</span>
          </TouchButton>
          <TouchButton
            variant="success"
            size="sm"
            onClick={handleStartTest}
            disabled={controlsDisabled || isTestRunning || !safety.ok}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Play className="w-6 h-6" />
            <span className="text-sm">{t('actions.start')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={controlsDisabled}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Square className="w-6 h-6" />
            <span className="text-sm">{t('actions.stop')}</span>
          </TouchButton>
        </div>

        {/* Group 2: Jog Control */}
        <div className="flex flex-col gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">Jog</span>
          <button
            onPointerDown={handleJogUpStart}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              btnHeight,
              isJogging === 'up' && 'active'
            )}
            style={{ touchAction: 'none' }}
          >
            <ChevronUp className="w-6 h-6" />
            <span className="text-sm">{t('manual.jogUp')}</span>
          </button>
          <button
            onPointerDown={handleJogDownStart}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              btnHeight,
              isJogging === 'down' && 'active'
            )}
            style={{ touchAction: 'none' }}
          >
            <ChevronDown className="w-6 h-6" />
            <span className="text-sm">{t('manual.jogDown')}</span>
          </button>
          <button
            onClick={() => !controlsDisabled && setKeypadOpen('speed')}
            disabled={controlsDisabled}
            className={cn(
              "flex items-center justify-between px-2 bg-secondary/30 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors",
              btnHeight,
              controlsDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-xs text-muted-foreground">{t('manual.speed')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-primary font-mono text-xs font-bold">{jogSpeed}</span>
              <span className="text-xs text-muted-foreground">mm/m</span>
            </div>
          </button>
        </div>

        {/* Group 3: Step Control */}
        <div className="flex flex-col gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">Step</span>
          <button
            onClick={() => !controlsDisabled && !liveData.servo_ready ? null : stepUp()}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              btnHeight
            )}
          >
            <ChevronUp className="w-6 h-6" />
            <span className="text-sm">{t('manual.stepUp')}</span>
          </button>
          <button
            onClick={() => !controlsDisabled && !liveData.servo_ready ? null : stepDown()}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              btnHeight
            )}
          >
            <ChevronDown className="w-6 h-6" />
            <span className="text-sm">{t('manual.stepDown')}</span>
          </button>
          <button
            onClick={() => !controlsDisabled && setKeypadOpen('distance')}
            disabled={controlsDisabled}
            className={cn(
              "flex items-center justify-between px-2 bg-secondary/30 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors",
              btnHeight,
              controlsDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-xs text-muted-foreground">Dist</span>
            <div className="flex items-center gap-0.5">
              <span className="text-primary font-mono text-xs font-bold">{stepDistance}</span>
              <span className="text-xs text-muted-foreground">mm</span>
            </div>
          </button>
        </div>

        {/* Group 4: Jaw/Clamp Control */}
        <div className="flex flex-col gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">Jaw</span>
          <TouchButton
            variant="success"
            size="sm"
            onClick={() => lockUpper.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Lock className="w-6 h-6" />
            <span className="text-sm">{t('manual.lockUpper')}</span>
          </TouchButton>
          <TouchButton
            variant="success"
            size="sm"
            onClick={() => lockLower.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Lock className="w-6 h-6" />
            <span className="text-sm">{t('manual.lockLower')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={() => unlockAll.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Unlock className="w-6 h-6" />
            <span className="text-sm">{t('manual.unlockAll')}</span>
          </TouchButton>
        </div>

        {/* Group 5: Servo Control */}
        <div className="flex flex-col gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">Servo</span>
          <TouchButton
            variant="success"
            size="sm"
            onClick={() => enableServo.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <Power className="w-6 h-6" />
            <span className="text-sm">{t('manual.enable')}</span>
          </TouchButton>
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() => disableServo.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <PowerOff className="w-6 h-6" />
            <span className="text-sm">{t('manual.disable')}</span>
          </TouchButton>
          <TouchButton
            variant="warning"
            size="sm"
            onClick={() => resetAlarm.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full h-[52px]"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-sm">{t('manual.resetAlarm')}</span>
          </TouchButton>
        </div>
      </div>

      {/* Chart - fills remaining space */}
      <div className="chart-container flex-1 min-h-[140px]">
        <ForceDeflectionChart
          data={chartData}
          targetDeflection={liveData.target_deflection}
        />
      </div>

      {/* Numeric Keypad */}
      <NumericKeypad
        isOpen={keypadOpen === 'speed'}
        onClose={() => setKeypadOpen(null)}
        onConfirm={(value) => setJogSpeed(value)}
        initialValue={jogSpeed}
        label={t('manual.speed')}
        unit="mm/m"
      />
      <NumericKeypad
        isOpen={keypadOpen === 'distance'}
        onClose={() => setKeypadOpen(null)}
        onConfirm={(value) => setStepDistance(value)}
        initialValue={stepDistance}
        label="Step Distance"
        unit="mm"
      />
    </div>
  );
};

export default Dashboard;