import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeSelector } from '@/components/ModeSelector';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { MachineIndicator } from '@/components/dashboard/MachineIndicator';
import { TouchButton } from '@/components/ui/TouchButton';
import { EStopButton } from '@/components/ui/EStopButton';
import { NumericKeypad, useNumericKeypad } from '@/components/ui/NumericKeypad';
import {
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Power,
  PowerOff,
  RotateCcw,
  Gauge,
  Move,
  Target,
  AlertTriangle,
  OctagonX,
  PauseCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLiveData, useJogControl } from '@/hooks/useLiveData';
import { useServoControl, useClampControl, useModeControl, useCommands } from '@/hooks/useApi';
import { StepControl } from '@/components/StepControl';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const ManualControl = () => {
  const { t } = useLanguage();
  const { liveData, isConnected } = useLiveData();
  const { jogForward, jogBackward, setJogSpeed } = useJogControl();
  const { enableServo, disableServo, resetAlarm } = useServoControl();
  const { lockUpper, lockLower, unlockAll } = useClampControl();
  const { setMode } = useModeControl();
  const { stopTest } = useCommands();

  const [jogSpeedActive, setJogSpeedActive] = useState(50);
  const [isJogging, setIsJogging] = useState<'up' | 'down' | null>(null);

  // Speed limits
  const MIN_SPEED = 1.2;
  const MAX_SPEED = 6000;

  // Numeric keypad hook
  const { openKeypad, keypadProps } = useNumericKeypad();

  // Track active jog state to prevent rapid on/off toggling
  const jogUpActive = useRef(false);
  const jogDownActive = useRef(false);

  // Global pointer release handler - catches release anywhere on screen
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
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, [jogForward, jogBackward]);

  // Mode control
  const isLocalMode = !liveData.remote_mode;
  const jogDisabled = isLocalMode || !isConnected;  // Jog needs Remote mode
  const commandsDisabled = !isConnected;  // Other commands work in any mode
  const isTestRunning = liveData.test_status === 2;
  const isMoving = isJogging !== null;
  const isEStopActive = liveData.e_stop_active;
  const isPLCStop = liveData.plc?.cpu_state === 'stop';

  // Call real API to change mode in PLC
  const handleModeChange = (remoteMode: boolean) => {
    setMode.mutate(remoteMode);
  };

  // Open speed keypad
  const handleOpenSpeedKeypad = useCallback(() => {
    if (jogDisabled) return;
    openKeypad({
      initialValue: jogSpeedActive.toString(),
      title: t('manual.speed') || 'Jog Speed',
      min: MIN_SPEED,
      max: MAX_SPEED,
      unit: 'mm/min',
      onConfirm: (value) => {
        const speed = parseFloat(value);
        setJogSpeedActive(speed);
        setJogSpeed(speed);
      },
    });
  }, [jogSpeedActive, jogDisabled, openKeypad, setJogSpeed, t]);

  // Jog Up (backward) - simple start, global handler will stop
  const handleJogUpStart = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (jogDisabled || jogUpActive.current) return;
    e.preventDefault();
    e.stopPropagation();
    jogUpActive.current = true;
    setIsJogging('up');
    jogBackward(true);
  }, [jogBackward, jogDisabled]);

  // Jog Down (forward) - simple start, global handler will stop
  const handleJogDownStart = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (jogDisabled || jogDownActive.current) return;
    e.preventDefault();
    e.stopPropagation();
    jogDownActive.current = true;
    setIsJogging('down');
    jogForward(true);
  }, [jogForward, jogDisabled]);

  // Clamp controls - work in any mode
  const handleLockUpper = () => {
    if (!commandsDisabled) lockUpper.mutate();
  };

  const handleLockLower = () => {
    if (!commandsDisabled) lockLower.mutate();
  };

  const handleUnlockAll = () => {
    if (!commandsDisabled) unlockAll.mutate();
  };

  // Servo controls - work in any mode
  const handleServoEnable = () => {
    if (!commandsDisabled) enableServo.mutate();
  };

  const handleServoDisable = () => {
    if (!commandsDisabled) disableServo.mutate();
  };

  const handleResetAlarm = () => {
    if (!commandsDisabled) resetAlarm.mutate();
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-bold">{t('manual.title')}</h1>
          {!isConnected && (
            <span className="connection-bar disconnected">
              <span className="w-2 h-2 rounded-full bg-current" />
              {t('connection.disconnected')}
            </span>
          )}
        </div>

        {/* E-Stop Always Available - Circular Industrial Style */}
        <EStopButton
          size="lg"
          label={t('actions.eStop')}
          activeLabel={t('estop.active')}
          isActive={liveData.e_stop_active}
          onClick={() => stopTest.mutate()}
        />
      </div>

      {/* E-Stop Active Warning */}
      {isEStopActive && (
        <Alert variant="destructive" className="animate-pulse border-red-500 bg-red-50">
          <OctagonX className="h-5 w-5" />
          <AlertTitle className="text-red-700 font-bold">
            {t('estop.activeTitle')}
          </AlertTitle>
          <AlertDescription className="text-red-600">
            {t('estop.activeDescription')}
          </AlertDescription>
        </Alert>
      )}

      {/* PLC STOP Mode Warning */}
      {isPLCStop && !isEStopActive && (
        <Alert className="border-orange-500 bg-orange-50">
          <PauseCircle className="h-5 w-5 text-orange-500" />
          <AlertTitle className="text-orange-700 font-bold">
            {t('plc.connectedStop')}
          </AlertTitle>
          <AlertDescription className="text-orange-600">
            {t('plc.stopWarning')}
          </AlertDescription>
        </Alert>
      )}

      {/* Live Values Row */}
      <div className="grid grid-cols-4 gap-3">
        <StatusCard
          title={t('dashboard.force')}
          value={(liveData.actual_force * 1000).toFixed(0)}
          unit="N"
          icon={<Gauge className="w-5 h-5" />}
          variant="info"
        />
        <StatusCard
          title="Weight"
          value={((liveData.actual_force * 1000) / 9.81).toFixed(1)}
          unit="kg"
          icon={<Gauge className="w-5 h-5" />}
          variant="info"
        />
        <StatusCard
          title={t('dashboard.deflection')}
          value={liveData.actual_deflection.toFixed(2)}
          unit="mm"
          icon={<Move className="w-5 h-5" />}
          variant="warning"
        />
        <StatusCard
          title={t('dashboard.position')}
          value={liveData.actual_position.toFixed(2)}
          unit="mm"
          icon={<Target className="w-5 h-5" />}
        />
      </div>

      {/* Mode Selector - Full Variant */}
      <ModeSelector
        remoteMode={liveData.remote_mode}
        onModeChange={handleModeChange}
        isTestRunning={isTestRunning}
        isMoving={isMoving}
        variant="full"
      />

      {/* Control Cards Grid */}
      <div className="control-grid">
        {/* Jog Control */}
        <StepControl />

        <Card className="industrial-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">{t('manual.jogControl')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jog Up Button */}
            <button
              onPointerDown={handleJogUpStart}
              onContextMenu={(e) => e.preventDefault()}
              disabled={jogDisabled || !liveData.servo_ready || isEStopActive}
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
              className={cn(
                'jog-button w-full flex flex-col items-center justify-center gap-2',
                isJogging === 'up' && 'active'
              )}
            >
              <ChevronUp className="w-10 h-10 pointer-events-none" />
              <span className="pointer-events-none">{t('manual.jogUp')}</span>
            </button>

            {/* Speed Input with Numeric Keypad */}
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">{t('manual.speed')}</span>
              </div>
              <button
                onClick={handleOpenSpeedKeypad}
                disabled={jogDisabled}
                className={cn(
                  "w-full p-4 rounded-xl border-2 border-border bg-secondary/30",
                  "hover:bg-secondary/50 hover:border-primary/50 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                <span className="text-2xl font-mono font-bold text-primary">
                  {jogSpeedActive}
                </span>
                <span className="text-lg text-muted-foreground">mm/min</span>
              </button>
              <p className="text-xs text-muted-foreground text-center">
                {t('manual.tapToEdit') || 'Tap to edit'} • Min: {MIN_SPEED} | Max: {MAX_SPEED}
              </p>
            </div>

            {/* Jog Down Button */}
            <button
              onPointerDown={handleJogDownStart}
              onContextMenu={(e) => e.preventDefault()}
              disabled={jogDisabled || !liveData.servo_ready || isEStopActive}
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
              className={cn(
                'jog-button w-full flex flex-col items-center justify-center gap-2',
                isJogging === 'down' && 'active'
              )}
            >
              <ChevronDown className="w-10 h-10 pointer-events-none" />
              <span className="pointer-events-none">{t('manual.jogDown')}</span>
            </button>
          </CardContent>
        </Card>

        {/* Clamp Control */}

        <Card className="industrial-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">{t('manual.clampControl')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              onClick={handleLockUpper}
              variant="success"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || lockUpper.isPending}
            >
              <Lock className="w-5 h-5" />
              {t('manual.lockUpper')}
            </TouchButton>

            <TouchButton
              onClick={handleLockLower}
              variant="success"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || lockLower.isPending}
            >
              <Lock className="w-5 h-5" />
              {t('manual.lockLower')}
            </TouchButton>

            <TouchButton
              onClick={handleUnlockAll}
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || unlockAll.isPending}
            >
              <Unlock className="w-5 h-5" />
              {t('manual.unlockAll')}
            </TouchButton>

            {/* Clamp Status */}
            <div className="pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <MachineIndicator
                  label={t('dashboard.upperLock')}
                  isActive={liveData.lock_upper}
                />
                <MachineIndicator
                  label={t('dashboard.lowerLock')}
                  isActive={liveData.lock_lower}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Movement Control */}

        {/* Servo Control */}

        <Card className="industrial-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">{t('manual.servoControl')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              onClick={handleServoEnable}
              variant="success"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || enableServo.isPending}
            >
              <Power className="w-5 h-5" />
              {t('manual.enable')}
            </TouchButton>

            <TouchButton
              onClick={handleServoDisable}
              variant="outline"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || disableServo.isPending}
            >
              <PowerOff className="w-5 h-5" />
              {t('manual.disable')}
            </TouchButton>

            <TouchButton
              onClick={handleResetAlarm}
              variant="warning"
              size="lg"
              className="w-full gap-2"
              disabled={commandsDisabled || resetAlarm.isPending}
            >
              <RotateCcw className="w-5 h-5" />
              {t('manual.resetAlarm')}
            </TouchButton>

            {/* Servo Status */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <MachineIndicator
                  label={t('dashboard.servoReady')}
                  isActive={liveData.servo_ready}
                />
                <MachineIndicator
                  label={t('dashboard.servoError')}
                  isActive={liveData.servo_error}
                  isError={liveData.servo_error}
                />
              </div>
              <MachineIndicator
                label={t('dashboard.atHome')}
                isActive={liveData.at_home}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Numeric Keypad Modal */}
      <NumericKeypad {...keypadProps} />
    </div>
  );
};

export default ManualControl;
