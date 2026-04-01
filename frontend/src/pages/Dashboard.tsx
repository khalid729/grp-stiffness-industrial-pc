import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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
  ChevronUp, ChevronDown, Lock, Unlock, Power, PowerOff, RotateCcw, Loader2
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
  const [completedGroupId, setCompletedGroupId] = useState<number | null>(null);
  const [groupState, setGroupState] = useState<{
    group_id: number | null;
    num_positions: number;
    current_position: number;
    angles: number[];
    is_active: boolean;
    is_complete: boolean;
  } | null>(null);
  const [stopCount, setStopCount] = useState(0);
  const [showBrief, setShowBrief] = useState(false);
  const briefShownRef = useRef(false);
  const [showNoSample, setShowNoSample] = useState(false);
  const [activeSample, setActiveSample] = useState<any>(null);
  // === Group test flow state ===
  const [flowDialog, setFlowDialog] = useState<'summary' | 'angle' | 'generating' | 'report' | null>(null);
  const [flowData, setFlowData] = useState<{
    position: number; angle: number; passed: boolean;
    force: number; stiffness: number; sn: number;
    nextAngle: number; groupId: number | null; isLast: boolean;
  }>({ position: 0, angle: 0, passed: false, force: 0, stiffness: 0, sn: 0, nextAngle: 0, groupId: null, isLast: false });
  const pollKeyRef = useRef('');
  const pollActiveRef = useRef(false);
  const [showCrackDialog, setShowCrackDialog] = useState<null | 'stage5' | 'stage21' | 'stage23'>(null);
  const [crackStage1Edit, setCrackStage1Edit] = useState(12.0);
  const [crackStage2Edit, setCrackStage2Edit] = useState(17.0);

  // Load crack % from PLC when Stage 5 dialog opens
  useEffect(() => {
    if (showCrackDialog === 'stage5') {
      fetch('/api/parameters').then(r => r.json()).then(p => {
        if (p.crack_stage1_percent) setCrackStage1Edit(p.crack_stage1_percent);
        if (p.crack_stage2_percent) setCrackStage2Edit(p.crack_stage2_percent);
      }).catch(() => {});
    }
  }, [showCrackDialog]);

  // fractureMaxPercent comes from activeSample

  const isLocalMode = !liveData.remote_mode;
  const controlsDisabled = isLocalMode || !isConnected;
  const testStage = liveData.test?.stage || 0;
  const isTestRunning = liveData.test_status >= 2 && liveData.test_status <= 5 && testStage > 0 && testStage < 11;
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

    // Only add data points during active test, not during return/complete/idle
    const isActiveTest = testStatus >= 2 && testStatus <= 5;
    const isReturnOrDone = testStage === 0 || testStage === 10 || testStage === 11;
    if (!isActiveTest || isReturnOrDone) return;

    // Use calculated deflection from backend (speed x time)
    const deflection = (liveData as any).calculated_deflection ?? 0;
    const force = forceN;

    // Skip if no meaningful data yet
    if (deflection <= 0 && force <= 0) return;

    setChartData(prev => [...prev, { deflection, force }]);
  }, [liveData.test_status, liveData.test?.stage, (liveData as any).calculated_deflection, forceN]);

  // Auto-open report when test completes
  useEffect(() => {
    const unsub = socketClient.on<{ test_id?: number; group?: any; test?: any; results?: any }>('test_complete', (data) => {
      console.log('TEST_COMPLETE EVENT:', JSON.stringify(data));
      toast.info('Test complete event received - pos: ' + (data.group?.current_position || 'N/A'));
      
      const summary = {
        force: data.results?.force_at_target || 0,
        stiffness: data.results?.ring_stiffness || 0,
        sn: data.results?.sn_class || 0,
        passed: data.test?.passed || false,
      };

      if (data.group && data.group.is_active) {
        setGroupState(data.group);
        const completedPos = data.group.current_position - 1;
        const angles = data.group.angles || [0, 40, 80];
        
        setPositionResult({
          position: completedPos,
          angle: angles[completedPos - 1] || 0,
          testId: data.test_id || null,
          passed: data.test?.passed || false,
          isLastPosition: data.group.is_complete,
        });
        setPositionSummary(summary);
        setShowPositionResult(true);

        if (!data.group.is_complete) {
          const nextPos = data.group.current_position;
          setNextAngle(angles[nextPos - 1] || 0);
        }
      } else {
        setGroupState(null);
        if (data.test_id) setCompletedTestId(data.test_id);
      }
    });
    return unsub;
  }, []);


  // Poll group state every 2 seconds to detect completion
  useEffect(() => {
    const poll = setInterval(() => {
      if (!pollActiveRef.current) return;
      if (flowDialog) return;
      if (showCrackDialog) return;
      
      // Quick check - skip if test is running
      fetch('/api/status').then(r => r.json()).then(status => {
        if (status.test && status.test.status >= 2 && status.test.status <= 5 
            && status.test.stage > 0 && status.test.stage !== 11) return null;
        return fetch('/api/groups/active').then(r => r.json()).then(g => ({status, g}));
      }).then(result => {
        if (!result) return;
        const {status, g} = result;
        const stage = status?.test?.stage || 0;
        if (stage > 0 && stage < 10) { pollKeyRef.current = ''; return; }
        if (stage !== 11) return;
        if (!g.is_active) return;
        
        const key = g.group_id + '-' + g.current_position;
        if (key === pollKeyRef.current) return;
        pollKeyRef.current = key;
        
        const completedPos = g.current_position - 1;
        const angles = g.angles || [0, 40, 80];
        setGroupState(g);
        
        if (g.is_complete) {
          // If crack test was done (mode 2), the crack/abort flow handles the report
          // Only show report from polling if no crack dialog was shown
          if (showCrackDialog) return;
          pollActiveRef.current = false;
          setFlowData(prev => ({ ...prev, groupId: g.group_id, isLast: true }));
          setFlowDialog('generating');
          const waitForSave = () => {
            fetch('/api/groups/' + g.group_id).then(r => r.json()).then(gd => {
              if (gd.tests && gd.tests.length >= g.num_positions) {
                // Extra wait to ensure data points are fully saved
                setTimeout(() => {
                  setCompletedGroupId(g.group_id);
                  setFlowDialog('report');
                  briefShownRef.current = false;
                }, 2000);
              } else {
                setTimeout(waitForSave, 1000);
              }
            }).catch(() => setTimeout(waitForSave, 1000));
          };
          setTimeout(waitForSave, 2000);
        } else {
          // Get pass/fail from backend - read the specific group's tests
          fetch('/api/groups/' + g.group_id).then(r => r.json()).then(groupData => {
            const groupTests = groupData?.tests || [];
            const lastTest = groupTests[completedPos - 1] || groupTests[groupTests.length - 1];
            setFlowData({
              position: completedPos,
              angle: angles[completedPos - 1] || 0,
              passed: lastTest?.passed ?? (status?.test?.passed || false),
              force: lastTest?.force_at_target ?? (status?.results?.force_at_target || 0),
              stiffness: lastTest?.stis ?? (status?.results?.ring_stiffness || 0),
              sn: lastTest?.sn_class ?? (status?.results?.sn_class || 0),
              nextAngle: angles[g.current_position - 1] || 0,
              groupId: g.group_id,
              isLast: false,
            });
            setFlowDialog('summary');
          }).catch(() => {
            // Fallback to PLC values
            setFlowData({
              position: completedPos,
              angle: angles[completedPos - 1] || 0,
              passed: status?.test?.passed || false,
              force: status?.results?.force_at_target || 0,
              stiffness: status?.results?.ring_stiffness || 0,
              sn: status?.results?.sn_class || 0,
              nextAngle: angles[g.current_position - 1] || 0,
              groupId: g.group_id,
              isLast: false,
            });
            setFlowDialog('summary');
          });
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, []);
  // Watch PLC waiting_user flag for crack dialogs
  useEffect(() => {
    const waitingUser = (liveData as any).hmi_ext?.waiting_user || false;
    const stage = liveData.test?.stage || 0;
    
    // Show dialog when PLC is waiting and no dialog is open
    if (waitingUser && !showCrackDialog) {
      if (stage === 5) setShowCrackDialog('stage5');
      else if (stage === 21) setShowCrackDialog('stage21');
      else if (stage === 23) setShowCrackDialog('stage23');
    }
    // Close dialog when PLC stops waiting
    if (!waitingUser && showCrackDialog) {
      setShowCrackDialog(null);
    }
  }, [(liveData as any).hmi_ext?.waiting_user, liveData.test?.stage, showCrackDialog]);

  const handleAcceptPosition = () => {
    setFlowDialog('angle'); // Show next angle dialog
  };

  const handleRetryPosition = async () => {
    if (!flowData.position || !groupState?.group_id) return;
    try {
      await fetch('/api/groups/' + groupState.group_id + '/retry/' + flowData.position, { method: 'POST' });
      const res = await fetch('/api/groups/active');
      const data = await res.json();
      setGroupState(data);
      pollKeyRef.current = '';
    } catch (e) {}
    setFlowDialog(null);
  };

  const paramError = (liveData as any).hmi_ext?.param_error || false;

  // Load active sample - refresh when page becomes visible (user returns from TestSetup)
  const loadActiveSample = () => {
    fetch('/api/samples/active').then(r => r.json()).then(d => {
      if (d.sample_id) fetch('/api/samples/' + d.sample_id).then(r => r.json()).then(s => {
        setActiveSample(s);
        // Sync sample params to PLC
        fetch('/api/parameters', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            pipe_diameter: s.pipe_diameter, pipe_length: s.pipe_length,
            deflection_percent: s.deflection_percent, target_sn_class: s.target_sn_class,
            crack_stage1_percent: s.crack_stage1_percent || 12,
            crack_stage2_percent: s.crack_stage2_percent || 17,
            fracture_max_percent: s.fracture_max_percent || 50,
          }),
        });
      }).catch(() => {});
      else setActiveSample(null);
    }).catch(() => {});
  };
  useEffect(() => {
    loadActiveSample();
    const onVisible = () => { if (document.visibilityState === 'visible') loadActiveSample(); };
    document.addEventListener('visibilitychange', onVisible);
    // Also poll every 5 seconds in case user switches tabs
    const poll = setInterval(() => {
      // Check test status from API, not stale closure
      fetch('/api/status').then(r => r.json()).then(s => {
        if (!s.test || s.test.status < 2) loadActiveSample();
      }).catch(() => {});
    }, 5000);
    return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(poll); };
  }, []);
  const [activeTestMode, setActiveTestMode] = useState(0);
  useEffect(() => {
    // Restore test_mode from localStorage to PLC on mount
    const savedType = localStorage.getItem('testType') || 'stiffness1';
    const modeMap: Record<string, number> = { stiffness1: 0, stiffness3: 0, crack: 1, fracture: 3 };
    const mode = modeMap[savedType] || 0;
    setActiveTestMode(mode);
    fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ test_mode: mode }) });
    // Also restore num_positions
    const npMap: Record<string, number> = { stiffness1: 1, stiffness3: 3, crack: 1, fracture: 1 };
    fetch('/api/test-metadata', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ num_positions: npMap[savedType] || 1, angles: npMap[savedType] === 3 ? [0,40,80] : [0] }) });

    const load = () => {
      // Check from API, not stale closure
      fetch('/api/status').then(r => r.json()).then(s => {
        if (s.test && s.test.status >= 2 && s.test.status <= 5 && s.test.stage > 0 && s.test.stage < 10) return;
        fetch('/api/parameters').then(r => r.json()).then((p: any) => setActiveTestMode(p.test_mode || 0)).catch(() => {});
      }).catch(() => {});
    };
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);
  const paramErrorCode = (liveData as any).hmi_ext?.param_error_code || 0;

  const handleStartTest = async () => {
    // Show brief dialog only for first test start (not between positions)
    if (activeSample && !briefShownRef.current) {
      briefShownRef.current = true;
      setShowBrief(true);
      return;
    }
    // If no sample, warn
    if (!activeSample) {
      setShowNoSample(true);
      return;
    }
    doStartTest();
  };

  const doStartTest = async () => {
    setShowBrief(false);
    pollActiveRef.current = true;
    setChartData([]);
    setLiveData(prev => ({ ...prev, test_status: 2 }));
    
    if (groupState && groupState.is_active && groupState.current_position === groupState.num_positions) {
      await fetch('/api/parameters', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ test_mode: 2 })
      });
    }
    startTest.mutate();
  };

  const handleStop = () => {
    if (stopCount === 0) {
      // First press: Stop test only (servo stays enabled for jog)
      fetch('/api/command/stop', { method: 'POST' });
      setStopCount(1);
      setTimeout(() => setStopCount(0), 5000);
    } else {
      // Second press: Abort - stop + reset PLC + reset group
      fetch('/api/command/stop', { method: 'POST' });
      setTimeout(() => {
        fetch('/api/servo/reset', { method: 'POST' });
        // Restore test_mode after reset
        setTimeout(() => {
          const savedType = localStorage.getItem('testType') || 'stiffness1';
          const modeMap: Record<string, number> = { stiffness1: 0, stiffness3: 0, crack: 1, fracture: 3 };
          const npMap: Record<string, number> = { stiffness1: 1, stiffness3: 3, crack: 1, fracture: 1 };
          fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ test_mode: modeMap[savedType] || 0 }) });
          fetch('/api/test-metadata', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ num_positions: npMap[savedType] || 1, angles: npMap[savedType] === 3 ? [0,40,80] : [0] }) });
        }, 1000);
      }, 500);
      fetch('/api/groups/reset', { method: 'POST' });
      setLiveData(prev => ({ ...prev, test_status: 0 }));
      setGroupState(null);
      setStopCount(0);
      pollActiveRef.current = false;
      setFlowDialog(null);
      briefShownRef.current = false;
    }
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
        <div className={cn("flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border", activeTestMode === 3 && "opacity-40")}>
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{activeTestMode === 1 ? t('testSetup.crackTest') : t('dashboard.group.stiffness')}</span>
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
            disabled={controlsDisabled || isTestRunning || !safety.ok || activeTestMode === 3}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Play className="w-6 h-6" />
            <span className="text-sm">{t('actions.start')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={!isConnected}
            className={cn("flex items-center justify-center gap-1.5 w-full min-h-[80px]", stopCount > 0 && "animate-pulse")}
          >
            <Square className="w-6 h-6" />
            <span className="text-sm">{stopCount > 0 ? t('actions.abort') : t('actions.stop')}</span>
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
        <div className={cn("flex flex-col justify-between gap-1.5 p-2 bg-card rounded-lg border border-border", activeTestMode !== 3 && "opacity-40")}>
          <span className="text-sm font-bold text-muted-foreground text-center uppercase tracking-wide">{t('dashboard.group.fracture')}</span>
          <TouchButton
            variant="warning"
            size="sm"
            onClick={() => {
              // Set mode to Fracture (3) then start
              fetch('/api/parameters', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ test_mode: 3, fracture_max_percent: activeSample?.fracture_max_percent || 50 })
              }).then(() => {
                handleStartTest();
              });
            }}
            disabled={controlsDisabled || isTestRunning || !safety.ok || activeTestMode !== 3}
            className="flex items-center justify-center gap-1.5 w-full min-h-[80px]"
          >
            <Play className="w-6 h-6" />
            <span className="text-sm">{t('actions.start')}</span>
          </TouchButton>
          <TouchButton
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={!isConnected || activeTestMode !== 3}
            className={cn("flex items-center justify-center gap-1.5 w-full min-h-[80px]", stopCount > 0 && "animate-pulse")}
          >
            <Square className="w-6 h-6" />
            <span className="text-sm">{stopCount > 0 ? t('actions.abort') : t('actions.stop')}</span>
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
              <span className="text-primary font-mono text-xl font-bold">{activeSample?.fracture_max_percent || 50}</span>
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

      {/* Active Test Info Bar */}
      {activeSample && (
        <div className={`w-full rounded-lg px-2 grid grid-cols-5 gap-0 min-h-[80px] text-white ${
          activeTestMode === 3 ? 'bg-red-600' : activeTestMode === 1 ? 'bg-orange-500' : 
          (localStorage.getItem('testType') === 'stiffness3' ? 'bg-emerald-600' : 'bg-blue-600')
        }`}>
          <div className="flex flex-col justify-center px-2 border-r border-white/20">
            <span className="text-[10px] opacity-70 uppercase">Sample</span>
            <p className="font-bold text-lg leading-tight">{activeSample.sample_id}</p>
          </div>
          <div className="flex flex-col justify-center px-2 border-r border-white/20">
            <span className="text-[10px] opacity-70 uppercase">Client</span>
            <p className="font-bold text-base leading-tight">{activeSample.client_name || '-'}</p>
          </div>
          <div className="flex flex-col justify-center px-2 border-r border-white/20">
            <span className="text-[10px] opacity-70 uppercase">Diameter</span>
            <p className="font-bold text-lg font-mono leading-tight">DN {activeSample.pipe_diameter}</p>
          </div>
          <div className="flex flex-col justify-center px-2 border-r border-white/20">
            <span className="text-[10px] opacity-70 uppercase">Target</span>
            <p className="font-bold text-lg font-mono leading-tight">SN {activeSample.target_sn_class}</p>
          </div>
          <div className="flex flex-col justify-center px-2">
            <span className="text-[10px] opacity-70 uppercase">Test Type</span>
            <p className="font-bold text-lg leading-tight">{activeTestMode === 3 ? 'Fracture' : activeTestMode === 1 ? 'Crack' : (localStorage.getItem('testType') === 'stiffness3' ? '3 Positions' : '1 Position')}</p>
          </div>
        </div>
      )}

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
        onConfirm={(value) => { 
          fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fracture_max_percent: value }) });
          if (activeSample) setActiveSample({...activeSample, fracture_max_percent: value});
        }}
        initialValue={activeSample?.fracture_max_percent || 50}
        label={t('dashboard.fractureMax')}
        unit="%"
      />
      {/* Position indicator moved to header (PortraitLayout) */}



      {/* Auto-open Test Report on completion */}
      <TestReportDialog
        testId={completedTestId}
        open={completedTestId !== null && flowDialog !== 'report'}
        onOpenChange={(open) => { if (!open) { setCompletedTestId(null); fetch('/api/servo/reset', { method: 'POST' }); } }}
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
            <TouchButton variant="outline" size="sm" onClick={() => { 
              userAbort.mutate(); 
              setShowCrackDialog(null);
              pollActiveRef.current = false;
              setFlowDialog('generating');
              if (groupState && groupState.group_id) {
                const gid = groupState.group_id;
                const np = groupState.num_positions;
                const waitForComplete = () => {
                  // Wait for PLC to finish (stage 0 or 11) AND all tests saved
                  Promise.all([
                    fetch('/api/status').then(r => r.json()),
                    fetch('/api/groups/' + gid).then(r => r.json()),
                  ]).then(([status, gd]) => {
                    const stage = status?.test?.stage || 0;
                    const isDone = stage === 0 || stage === 11;
                    const allSaved = gd.tests && gd.tests.length >= np;
                    if (isDone && allSaved) {
                      setTimeout(() => {
                        setCompletedGroupId(gid);
                        setFlowDialog('report');
                        briefShownRef.current = false;
                        // Restore test mode
                        const savedType = localStorage.getItem('testType') || 'stiffness1';
                        const modeMap: Record<string, number> = { stiffness1: 0, stiffness3: 0, crack: 1, fracture: 3 };
                        fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ test_mode: modeMap[savedType] || 0 }) });
                      }, 2000);
                    } else {
                      setTimeout(waitForComplete, 1000);
                    }
                  }).catch(() => setTimeout(waitForComplete, 1000));
                };
                setTimeout(waitForComplete, 1000);
              }
            }} className="flex-1 min-h-[52px]">
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
            <p className="text-lg font-semibold">{t("testSetup.crackQuestion")}</p>
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
            <p className="text-lg font-semibold">{t("testSetup.crackQuestion")}</p>
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




      {/* No Sample Warning */}
      {showNoSample && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowNoSample(false)}>
          <div className="bg-card w-full max-w-sm p-6 rounded-xl border shadow-2xl text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-bold">No Sample Selected</h2>
            <p className="text-muted-foreground">Go to Test Setup and select a sample first</p>
            <TouchButton variant="primary" size="sm" onClick={() => setShowNoSample(false)} className="w-full min-h-[52px] text-base">OK</TouchButton>
          </div>
        </div>
      )}

      {/* Sample Brief before Start */}
      {showBrief && activeSample && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-card w-full max-w-md p-5 rounded-xl border shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-center">Confirm Test</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-secondary/20 rounded"><span className="text-muted-foreground">Sample:</span> <span className="font-bold">{activeSample.sample_id}</span></div>
              <div className="p-2 bg-secondary/20 rounded"><span className="text-muted-foreground">Client:</span> <span className="font-bold">{activeSample.client_name || '-'}</span></div>
              <div className="p-2 bg-secondary/20 rounded"><span className="text-muted-foreground">Project:</span> <span className="font-bold">{activeSample.project_name || '-'}</span></div>
              <div className="p-2 bg-secondary/20 rounded"><span className="text-muted-foreground">Operator:</span> <span className="font-bold">{activeSample.operator || '-'}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-primary/10 rounded"><p className="text-xs text-muted-foreground">Diameter</p><p className="font-mono font-bold text-lg">{activeSample.pipe_diameter} mm</p></div>
              <div className="p-2 bg-primary/10 rounded"><p className="text-xs text-muted-foreground">Target SN</p><p className="font-mono font-bold text-lg">SN {activeSample.target_sn_class}</p></div>
              <div className="p-2 bg-primary/10 rounded"><p className="text-xs text-muted-foreground">Positions</p><p className="font-mono font-bold text-lg">{activeSample.num_positions}P</p></div>
            </div>
            <div className="flex gap-3">
              <TouchButton variant="outline" size="sm" onClick={() => setShowBrief(false)} className="flex-1 min-h-[52px] text-base">Cancel</TouchButton>
              <TouchButton variant="success" size="sm" onClick={doStartTest} className="flex-1 min-h-[52px] text-base">Start Test</TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* === FLOW DIALOGS === */}
      
      {/* Summary after each position */}
      <Dialog open={flowDialog === 'summary'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              {t('testSetup.positionOf')} {flowData.position}/{groupState?.num_positions || 3} — {flowData.angle}°
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-center">
              <span className={cn(
                'inline-block px-5 py-2 rounded-lg text-lg font-bold',
                flowData.passed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}>
                {flowData.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-secondary/30 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Force</p>
                <p className="text-base font-bold font-mono">{(flowData.force / 1000).toFixed(2)} kN</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Stiffness</p>
                <p className="text-base font-bold font-mono">{flowData.stiffness.toFixed(0)} N/m\u00b2</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">SN</p>
                <p className="text-base font-bold font-mono">SN {flowData.sn}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <TouchButton variant="primary" size="sm" onClick={handleAcceptPosition} className="w-full min-h-[48px]">
              {t('testSetup.nextPosition')}
            </TouchButton>
            <div className="flex gap-2">
              <TouchButton variant="outline" size="sm" onClick={handleRetryPosition} className="flex-1 min-h-[44px] text-sm">
                {t('testSetup.retryPosition')}
              </TouchButton>
              <TouchButton variant="destructive" size="sm" onClick={() => {
                fetch('/api/command/stop', { method: 'POST' });
                fetch('/api/groups/reset', { method: 'POST' });
                setFlowDialog(null); setGroupState(null); pollActiveRef.current = false;
              }} className="flex-1 min-h-[44px] text-sm">
                {t('actions.abort')}
              </TouchButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Next angle instruction */}
      <Dialog open={flowDialog === 'angle'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {t('testSetup.positionOf')} {groupState?.current_position || ''}/{groupState?.num_positions || 3}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <p className="text-4xl font-bold text-primary">{flowData.nextAngle}°</p>
            <p className="text-lg text-muted-foreground">{t('testSetup.placeAtAngle')} {flowData.nextAngle}°</p>
          </div>
          <DialogFooter>
            <TouchButton variant="primary" size="sm" onClick={() => setFlowDialog(null)} className="w-full min-h-[52px]">
              OK
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generating report progress */}
      {flowDialog === 'generating' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-card w-full max-w-sm p-6 rounded-xl border shadow-2xl">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-semibold">{t('report.generating')}</p>
              <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
            <TouchButton variant="outline" size="sm" onClick={() => { setFlowDialog(null); pollActiveRef.current = false; briefShownRef.current = false; }} className="w-full min-h-[44px] mt-2">Cancel</TouchButton>
          </div>
        </div>
      )}

      <GroupReportDialog
        groupId={completedGroupId}
        open={flowDialog === 'report'}
        onOpenChange={(open) => { if (!open) { 
          setFlowDialog(null); setCompletedGroupId(null); setGroupState(null); 
          fetch('/api/servo/reset', { method: 'POST' });
          // Restore test_mode from localStorage
          const savedType = localStorage.getItem('testType');
          const modeMap: Record<string, number> = { stiffness1: 0, stiffness3: 0, crack: 1, fracture: 3 };
          if (savedType && savedType in modeMap) {
            fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ test_mode: modeMap[savedType] }) });
          }
        } }}
      />
    </div>
  );
};

export default Dashboard;