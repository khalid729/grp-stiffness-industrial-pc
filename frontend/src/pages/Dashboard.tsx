import { useState, useEffect, useCallback, useRef } from 'react';
import { TestReportDialog } from '@/components/reports/TestReportDialog';
import { GroupReportDialog } from '@/components/reports/GroupReportDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { socketClient } from '@/api/socket';
import { ForceDeflectionChart } from '@/components/dashboard/ForceDeflectionChart';
import { TouchButton } from '@/components/ui/TouchButton';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { 
  Home, Play, Square, 
  ChevronUp, ChevronDown, Lock, Unlock, Power, PowerOff, RotateCcw
} from 'lucide-react';
import { useLiveData, useJogControl } from '@/hooks/useLiveData';
import { useStepControl } from '@/hooks/useStepControl';
import { useCommands, useServoControl, useClampControl, useTestModeControl } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { t } = useLanguage();
  const { liveData, setLiveData, isConnected } = useLiveData();
  const { userContinue, userAbort, crackFound, continueToCrack } = useTestModeControl();
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
  const [keypadOpen, setKeypadOpen] = useState<'speed' | 'distance' | 'fracture' | null>(null);

  const [completedTestId, setCompletedTestId] = useState<number | null>(null);
  const [groupState, setGroupState] = useState<{
    group_id: number | null;
    num_positions: number;
    current_position: number;
    angles: number[];
    is_active: boolean;
    is_complete: boolean;
  } | null>(null);
  const [showAngleDialog, setShowAngleDialog] = useState(false);
  const [nextAngle, setNextAngle] = useState(0);
  const [showPositionResult, setShowPositionResult] = useState(false);
  const [showGroupReport, setShowGroupReport] = useState(false);
  const [showCrackDialog, setShowCrackDialog] = useState<null | 'stage5' | 'stage21' | 'stage23'>(null);
  const [crackStage1Edit, setCrackStage1Edit] = useState(12.0);
  const [crackStage2Edit, setCrackStage2Edit] = useState(17.0);
  const [prevWaitingUser, setPrevWaitingUser] = useState(false);
  const [fractureMaxPercent, setFractureMaxPercent] = useState(50);
  const [completedGroupId, setCompletedGroupId] = useState<number | null>(null);
  const [positionResult, setPositionResult] = useState<{
    position: number;
    angle: number;
    testId: number | null;
    passed: boolean;
    isLastPosition: boolean;
  } | null>(null);

  const isLocalMode = !liveData.remote_mode;
  const controlsDisabled = isLocalMode || !isConnected;
  const isTestRunning = liveData.test_status >= 2 && liveData.test_status <= 5;
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

  // Track previous test status to detect transitions
  const prevTestStatus = useRef(liveData.test_status);

  // Chart data update - use calculated deflection, stop before return phase
  useEffect(() => {
    const testStatus = liveData.test_status;
    const testStage = liveData.test?.stage ?? 0;

    // Detect test start: transition into active testing (status >= 2)
    if (testStatus >= 2 && prevTestStatus.current < 2) {
      setChartData([]);
    }
    prevTestStatus.current = testStatus;

    // Only add data points during active test (status 2-5), not during return
    const isActiveTest = testStatus >= 2 && testStatus <= 5;
    if (!isActiveTest || testStage >= 7) return;

    // Use calculated deflection from backend (speed x time)
    const deflection = (liveData as any).calculated_deflection ?? 0;
    const force = forceN;

    // Skip if no meaningful data yet
    if (deflection <= 0 && force <= 0) return;

    setChartData(prev => [...prev, { deflection, force }]);
  }, [liveData.test_status, liveData.test?.stage, (liveData as any).calculated_deflection, forceN]);

  // Auto-open report when test completes
  useEffect(() => {
    const unsub = socketClient.on<{ test_id?: number; group?: any; test?: any }>('test_complete', (data) => {
      if (data.group && data.group.is_active) {
        setGroupState(data.group);
        const completedPos = data.group.current_position - 1;
        const angles = data.group.angles || [0, 40, 80];
        
        // Show position result dialog
        setPositionResult({
          position: completedPos,
          angle: angles[completedPos - 1] || 0,
          testId: data.test_id || null,
          passed: data.test?.passed || false,
          isLastPosition: data.group.is_complete,
        });
        setShowPositionResult(true);

        if (!data.group.is_complete) {
          const nextPos = data.group.current_position;
          setNextAngle(angles[nextPos - 1] || 0);
        }
      } else {
        // Single position test - show report directly
        setGroupState(null);
        if (data.test_id) setCompletedTestId(data.test_id);
      }
    });
    return unsub;
  }, []);

  // Fetch active group state on mount
  useEffect(() => {
    fetch('/api/groups/active').then(r => r.json()).then(data => {
      if (data.is_active) setGroupState(data);
    }).catch(() => {});
  }, []);

  // Watch PLC waiting_user flag for crack dialogs
  useEffect(() => {
    const waitingUser = (liveData as any).hmi_ext?.waiting_user || false;
    const stage = liveData.test?.stage || 0;
    
    if (waitingUser && !prevWaitingUser) {
      // PLC just started waiting
      if (stage === 5) setShowCrackDialog('stage5');
      else if (stage === 21) setShowCrackDialog('stage21');
      else if (stage === 23) setShowCrackDialog('stage23');
    }
    if (!waitingUser && prevWaitingUser) {
      // PLC acknowledged input - close dialog
      setShowCrackDialog(null);
    }
    setPrevWaitingUser(waitingUser);
  }, [(liveData as any).hmi_ext?.waiting_user, liveData.test?.stage]);

  const handleAcceptPosition = () => {
    setShowPositionResult(false);
    if (positionResult?.isLastPosition) {
      // All done - show group report
      if (groupState?.group_id) {
        setCompletedGroupId(groupState.group_id);
        setShowGroupReport(true);
      }
    } else {
      // Show next angle dialog
      setShowAngleDialog(true);
    }
  };

  const handleRetryPosition = async () => {
    if (!positionResult || !groupState?.group_id) return;
    try {
      await fetch(`/api/groups/${groupState.group_id}/retry/${positionResult.position}`, { method: 'POST' });
      // Refresh group state
      const res = await fetch('/api/groups/active');
      const data = await res.json();
      setGroupState(data);
    } catch (e) {}
    setShowPositionResult(false);
  };

  const paramError = (liveData as any).hmi_ext?.param_error || false;
  const paramErrorCode = (liveData as any).hmi_ext?.param_error_code || 0;

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

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up">
      {/* Control Groups - Horizontal Layout - Equal Width */}
      <div className="grid grid-cols-5 gap-2">
        {/* Group 1: Stiffness Test Control */}
        <div className="flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.stiffness')}</span>
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() => goHome.mutate()}
            disabled={controlsDisabled || goHome.isPending}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">{t('actions.home')}</span>
          </TouchButton>
          <TouchButton
            variant="success"
            size="sm"
            onClick={handleStartTest}
            disabled={controlsDisabled || isTestRunning || !safety.ok}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Play className="w-6 h-6" />
            <span className="text-sm">{t('actions.start')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={controlsDisabled}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Square className="w-6 h-6" />
            <span className="text-sm">{t('actions.stop')}</span>
          </TouchButton>
        </div>

        {/* Group 2: Jog Control */}
        <div className="flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.jog')}</span>
          <button
            onPointerDown={handleJogUpStart}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              "min-h-[80px]",
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
              "min-h-[80px]",
              isJogging === 'down' && 'active'
            )}
            style={{ touchAction: 'none' }}
          >
            <ChevronDown className="w-6 h-6" />
            <span className="text-sm">{t('manual.jogDown')}</span>
          </button>
          <button
            onClick={() => isConnected && setKeypadOpen('speed')}
            disabled={!isConnected}
            className={cn(
              "flex items-center justify-between px-2 bg-secondary/30 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors",
              "min-h-[80px]",
              !isConnected && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-base text-muted-foreground">{t('manual.speed')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-primary font-mono text-xl font-bold">{jogSpeed}</span>
              <span className="text-base text-muted-foreground">{t('dashboard.speedUnit')}</span>
            </div>
          </button>
        </div>

        {/* Group 3: Step Control */}
        <div className="flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.step')}</span>
          <button
            onClick={() => !controlsDisabled && !liveData.servo_ready ? null : stepUp()}
            disabled={controlsDisabled || !liveData.servo_ready}
            className={cn(
              "jog-button w-full flex items-center justify-center gap-1.5 rounded-lg",
              "min-h-[80px]"
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
              "min-h-[80px]"
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
              "min-h-[80px]",
              controlsDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-base text-muted-foreground">{t('dashboard.dist')}</span>
            <div className="flex items-center gap-0.5">
              <span className="text-primary font-mono text-xl font-bold">{stepDistance}</span>
              <span className="text-base text-muted-foreground">mm</span>
            </div>
          </button>
        </div>

        {/* Group 4: Fracture Test Control */}
        <div className="flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.fracture')}</span>
          <TouchButton
            variant="warning"
            size="sm"
            onClick={() => {
              // Set mode to Fracture (3) then start
              fetch('/api/parameters', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ test_mode: 3, fracture_max_percent: fractureMaxPercent })
              }).then(() => {
                handleStartTest();
              });
            }}
            disabled={controlsDisabled || isTestRunning || !safety.ok}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Play className="w-6 h-6" />
            <span className="text-sm">{t('actions.start')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={controlsDisabled}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Square className="w-6 h-6" />
            <span className="text-sm">{t('actions.stop')}</span>
          </TouchButton>
          <button
            onClick={() => !controlsDisabled && setKeypadOpen('fracture')}
            disabled={controlsDisabled}
            className={cn(
              "flex items-center justify-between px-2 bg-secondary/30 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors",
              "min-h-[80px]",
              controlsDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-base text-muted-foreground">Max%</span>
            <div className="flex items-center gap-0.5">
              <span className="text-primary font-mono text-xl font-bold">{fractureMaxPercent}</span>
              <span className="text-base text-muted-foreground">%</span>
            </div>
          </button>
        </div>

        {/* Group 5: Servo Control */}
        <div className="flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border">
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.servo')}</span>
          <TouchButton
            variant="success"
            size="sm"
            onClick={() => enableServo.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Power className="w-6 h-6" />
            <span className="text-sm">{t('manual.enable')}</span>
          </TouchButton>
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() => disableServo.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <PowerOff className="w-6 h-6" />
            <span className="text-sm">{t('manual.disable')}</span>
          </TouchButton>
          <TouchButton
            variant="warning"
            size="sm"
            onClick={() => resetAlarm.mutate()}
            disabled={!isConnected}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
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
        unit={t('dashboard.speedUnit')}
      />
      <NumericKeypad
        isOpen={keypadOpen === 'distance'}
        onClose={() => setKeypadOpen(null)}
        onConfirm={(value) => setStepDistance(value)}
        initialValue={stepDistance}
        label={t('dashboard.stepDistance')}
        unit="mm"
      />
      <NumericKeypad
        isOpen={keypadOpen === 'fracture'}
        onClose={() => setKeypadOpen(null)}
        onConfirm={(value) => setFractureMaxPercent(value)}
        initialValue={fractureMaxPercent}
        label={t('dashboard.fractureMax')}
        unit="%"
      />
      {/* Position Indicator */}
      {groupState && groupState.is_active && !groupState.is_complete && (
        <div className="fixed top-2 right-2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold">
          <span>{t('testSetup.positionOf')} {Math.min(groupState.current_position, groupState.num_positions)}/{groupState.num_positions}</span>
          <span className="text-primary-foreground/70">|</span>
          <span>{t('testSetup.angle')}: {groupState.angles[(groupState.current_position > groupState.num_positions ? groupState.num_positions : groupState.current_position) - 1]}°</span>
        </div>
      )}

      {/* Next Angle Dialog */}
      <Dialog open={showAngleDialog} onOpenChange={setShowAngleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {t('testSetup.positionOf')} {groupState ? groupState.current_position : ''}/{groupState?.num_positions || 3}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <p className="text-4xl font-bold text-primary">{nextAngle}°</p>
            <p className="text-lg text-muted-foreground">{t('testSetup.placeAtAngle')} {nextAngle}°</p>
          </div>
          <DialogFooter>
            <TouchButton variant="primary" size="sm" onClick={() => setShowAngleDialog(false)} className="w-full min-h-[52px]">
              {t('settings.save')}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-open Test Report on completion */}
      <TestReportDialog
        testId={completedTestId}
        open={completedTestId !== null && !showGroupReport}
        onOpenChange={(open) => { if (!open) setCompletedTestId(null); }}
      />

      {/* Stage 5 Dialog — Continue to Crack? (after stiffness complete in Mode 2) */}
      <Dialog open={showCrackDialog === 'stage5'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('testSetup.continueToCrack')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Ring Stiffness</p>
              <p className="text-2xl font-bold">{liveData.results?.ring_stiffness?.toFixed(1) || '-'} kN/m²</p>
              <p className="text-sm">SN {liveData.results?.sn_class || '-'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('testSetup.crackStage1')}</span>
                <span className="font-mono font-bold">{crackStage1Edit}%</span>
              </div>
              <Slider value={[crackStage1Edit]} onValueChange={(v) => setCrackStage1Edit(v[0])} min={5} max={30} step={0.5} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('testSetup.crackStage2')}</span>
                <span className="font-mono font-bold">{crackStage2Edit}%</span>
              </div>
              <Slider value={[crackStage2Edit]} onValueChange={(v) => setCrackStage2Edit(v[0])} min={10} max={35} step={0.5} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <TouchButton variant="outline" size="sm" onClick={() => { userAbort.mutate(); setShowCrackDialog(null); }} className="flex-1 min-h-[52px]">
              {t('testSetup.stiffnessOnly')}
            </TouchButton>
            <TouchButton variant="primary" size="sm" onClick={() => {
              // Update crack % in PLC before continuing
              fetch('/api/parameters', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ crack_stage1_percent: crackStage1Edit, crack_stage2_percent: crackStage2Edit })
              }).then(() => {
                continueToCrack.mutate();
                setShowCrackDialog(null);
              });
            }} className="flex-1 min-h-[52px]">
              {t('testSetup.crackTest')}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage 21 Dialog — Crack Inspection Stage 1 */}
      <Dialog open={showCrackDialog === 'stage21'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('testSetup.crackInspection')} — Stage 1</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl font-bold text-primary">{(liveData as any).crack?.deflection_stage1?.toFixed(1) || '-'} mm</p>
            <p className="text-sm text-muted-foreground">{t('testSetup.forceAt')}: {(liveData as any).crack?.force_stage1?.toFixed(0) || '-'} N</p>
            <p className="text-lg font-semibold">هل يوجد كراك؟</p>
          </div>
          <DialogFooter className="flex gap-2">
            <TouchButton variant="destructive" size="sm" onClick={() => { crackFound.mutate(); setShowCrackDialog(null); }} className="flex-1 min-h-[52px]">
              {t('testSetup.crackFound')}
            </TouchButton>
            <TouchButton variant="success" size="sm" onClick={() => { userContinue.mutate(); setShowCrackDialog(null); }} className="flex-1 min-h-[52px]">
              {t('testSetup.noCrack')}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage 23 Dialog — Crack Inspection Stage 2 (Final) */}
      <Dialog open={showCrackDialog === 'stage23'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('testSetup.crackInspection')} — Stage 2</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl font-bold text-primary">{(liveData as any).crack?.deflection_stage2?.toFixed(1) || '-'} mm</p>
            <p className="text-sm text-muted-foreground">{t('testSetup.forceAt')}: {(liveData as any).crack?.force_stage2?.toFixed(0) || '-'} N</p>
            <p className="text-lg font-semibold">هل يوجد كراك؟</p>
          </div>
          <DialogFooter className="flex gap-2">
            <TouchButton variant="destructive" size="sm" onClick={() => { crackFound.mutate(); setShowCrackDialog(null); }} className="flex-1 min-h-[52px]">
              {t('testSetup.crackFound')}
            </TouchButton>
            <TouchButton variant="success" size="sm" onClick={() => { userContinue.mutate(); setShowCrackDialog(null); }} className="flex-1 min-h-[52px]">
              {t('testSetup.noCrackPass')}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GroupReportDialog
        groupId={completedGroupId}
        open={showGroupReport}
        onOpenChange={(open) => { if (!open) { setShowGroupReport(false); setCompletedGroupId(null); setGroupState(null); } }}
      />
    </div>
  );
};

export default Dashboard;