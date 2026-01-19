import { useState, useEffect } from 'react';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { MachineIndicator } from '@/components/dashboard/MachineIndicator';
import { TestStatusBadge } from '@/components/dashboard/TestStatusBadge';
import { ForceDeflectionChart } from '@/components/dashboard/ForceDeflectionChart';
import { SafetyIndicators } from '@/components/dashboard/SafetyIndicators';
import { TestProgress } from '@/components/dashboard/TestProgress';
import { ModeSelector } from '@/components/ModeSelector';
import { TouchButton } from '@/components/ui/TouchButton';
import { EStopButton } from '@/components/ui/EStopButton';
import { Progress } from '@/components/ui/progress';
import { Gauge, Move, Target, Activity, Home, Play, Square, RotateCcw, Scale } from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { useCommands, useModeControl, useTareControl } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { liveData, isConnected } = useLiveData();
  const { startTest, stopTest, goHome } = useCommands();
  const { setMode } = useModeControl();
  const { tareLoadCell, zeroPosition } = useTareControl();

  // Chart data - accumulate from live data
  const [chartData, setChartData] = useState<{ deflection: number; force: number }[]>([]);

  // Get safety data (support both new and old structure)
  const safety = liveData.safety || {
    e_stop: liveData.e_stop_active || false,
    upper_limit: liveData.upper_limit || false,
    lower_limit: liveData.lower_limit || false,
    home: liveData.at_home || false,
    ok: true,
    motion_allowed: true,
  };

  // Get test data (support both new and old structure)
  const testStage = liveData.test?.stage ?? 0;
  const testProgress = liveData.test?.progress ?? liveData.test_progress ?? 0;

  // Mode state
  const isLocalMode = !liveData.remote_mode && !(liveData.mode?.remote);
  const controlsDisabled = isLocalMode || !isConnected;
  const isTestRunning = liveData.test_status === 2 || (testStage >= 1 && testStage <= 7);

  // Get force value (support both new and old structure)
  const forceKN = liveData.force?.kN ?? liveData.actual_force ?? 0;
  const forceN = forceKN * 1000;

  // Update chart data when testing
  useEffect(() => {
    if (liveData.test_status === 2 || isTestRunning) {
      setChartData(prev => {
        const lastPoint = prev[prev.length - 1];
        const currentDeflection = liveData.deflection?.actual ?? liveData.actual_deflection ?? 0;
        if (lastPoint && Math.abs(lastPoint.deflection - currentDeflection) < 0.01) {
          return prev;
        }
        return [...prev, {
          deflection: currentDeflection,
          force: forceN,
        }];
      });
    } else if (liveData.test_status === 1 || testStage === 1) {
      setChartData([]);
    }
  }, [liveData.actual_deflection, liveData.deflection?.actual, forceN, liveData.test_status, testStage, isTestRunning]);

  // Call real API to change mode in PLC
  const handleModeChange = (remoteMode: boolean) => {
    setMode.mutate(remoteMode);
  };

  const handleHome = () => {
    goHome.mutate();
  };

  const handleStartTest = () => {
    setChartData([]);
    startTest.mutate();
  };

  const handleStop = () => {
    stopTest.mutate();
  };

  const handleTare = () => {
    tareLoadCell.mutate();
  };

  const handleZeroPosition = () => {
    zeroPosition.mutate();
  };

  const testStatus = liveData.test_status as 0 | 1 | 2 | 3 | 4 | 5 | -1;
  const actualPosition = liveData.position?.actual ?? liveData.actual_position ?? 0;
  const targetDeflection = liveData.deflection?.target ?? liveData.target_deflection ?? 0;
  const actualDeflection = liveData.deflection?.actual ?? liveData.actual_deflection ?? 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-bold">{t('nav.dashboard')}</h1>
          <TestStatusBadge status={testStatus} />
          {!isConnected && (
            <span className="connection-bar disconnected">
              <span className="w-2 h-2 rounded-full bg-current" />
              {t('connection.disconnected')}
            </span>
          )}
        </div>

        {/* Mode Selector - Compact */}
        <ModeSelector
          remoteMode={liveData.remote_mode || liveData.mode?.remote || false}
          onModeChange={handleModeChange}
          isTestRunning={isTestRunning}
          variant="compact"
        />
      </div>

      {/* Safety Indicators */}
      <SafetyIndicators
        eStop={safety.e_stop}
        upperLimit={safety.upper_limit}
        lowerLimit={safety.lower_limit}
        home={safety.home}
        safetyOk={safety.ok}
        motionAllowed={safety.motion_allowed}
      />

      {/* Test Progress */}
      {(isTestRunning || testStage > 0) && (
        <TestProgress
          stage={testStage}
          progress={testProgress}
          isRunning={isTestRunning}
        />
      )}

      {/* Status Cards with TARE/ZERO buttons */}
      <div className="status-grid">
        <div className="space-y-2">
          <StatusCard
            title={t('dashboard.force')}
            value={forceN.toFixed(0)}
            unit="N"
            icon={<Gauge className="w-5 h-5" />}
            variant="info"
          />
          <TouchButton
            variant="outline"
            size="sm"
            onClick={handleTare}
            disabled={controlsDisabled || tareLoadCell.isPending || isTestRunning}
            className="w-full gap-2"
          >
            <Scale className="w-4 h-4" />
            {t('actions.tare') || 'TARE'}
          </TouchButton>
        </div>
        
        <StatusCard
          title={t('dashboard.deflection')}
          value={actualDeflection.toFixed(2)}
          unit="mm"
          icon={<Move className="w-5 h-5" />}
          variant="warning"
        />
        
        <div className="space-y-2">
          <StatusCard
            title={t('dashboard.position')}
            value={actualPosition.toFixed(2)}
            unit="mm"
            icon={<Target className="w-5 h-5" />}
          />
          <TouchButton
            variant="outline"
            size="sm"
            onClick={handleZeroPosition}
            disabled={controlsDisabled || zeroPosition.isPending || isTestRunning}
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('actions.zero') || 'ZERO'}
          </TouchButton>
        </div>
        
        <StatusCard
          title={t('dashboard.status')}
          value={t(`status.${['idle', 'starting', 'testing', 'atTarget', 'returning', 'complete'][liveData.test_status] || 'error'}`)}
          icon={<Activity className="w-5 h-5" />}
          variant={liveData.test_status === 2 ? 'warning' : liveData.test_status === 5 ? 'success' : 'default'}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
          <TouchButton
            variant="outline"
            onClick={handleHome}
            disabled={controlsDisabled || goHome.isPending}
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            {t('actions.home') || 'HOME'}
          </TouchButton>
          <TouchButton
            variant="success"
            onClick={handleStartTest}
            disabled={controlsDisabled || !liveData.servo_ready || liveData.servo_error || isTestRunning || startTest.isPending || !safety.ok}
            className="gap-2"
          >
            <Play className="w-5 h-5" />
            {t('actions.start') || 'START'}
          </TouchButton>
          <TouchButton
            variant="destructive"
            onClick={handleStop}
            disabled={controlsDisabled || stopTest.isPending}
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            {t('actions.stop') || 'STOP'}
          </TouchButton>
        </div>
        
        {/* Separator */}
        <div className="hidden md:flex items-center h-16 px-2">
          <div className="w-px h-full bg-border/50"></div>
        </div>
        
        {/* E-Stop - Isolated Emergency Control */}
        <div className="flex-shrink-0 p-2 rounded-xl bg-destructive/5 border border-destructive/20">
          <EStopButton
            size="md"
            label={t('actions.eStop')}
            activeLabel={t('estop.active')}
            isActive={safety.e_stop}
            onClick={handleStop}
          />
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-container relative">
        <ForceDeflectionChart
          data={chartData}
          targetDeflection={targetDeflection}
        />
      </div>

      {/* Machine Indicators */}
      <div className="industrial-card p-4">
        <h3 className="text-sm lg:text-base font-semibold mb-3 text-muted-foreground">
          {t('dashboard.machineIndicators')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MachineIndicator
            label={t('dashboard.servoReady')}
            isActive={liveData.servo_ready || liveData.servo?.ready || false}
          />
          <MachineIndicator
            label={t('dashboard.servoEnabled')}
            isActive={liveData.servo_enabled || liveData.servo?.enabled || false}
          />
          <MachineIndicator
            label={t('dashboard.servoError')}
            isActive={liveData.servo_error || liveData.servo?.error || false}
            isError={liveData.servo_error || liveData.servo?.error || false}
          />
          <MachineIndicator
            label={t('dashboard.atHome')}
            isActive={liveData.at_home || liveData.servo?.at_home || false}
          />
          <MachineIndicator
            label={t('dashboard.upperLock')}
            isActive={liveData.lock_upper || liveData.clamps?.upper || false}
          />
          <MachineIndicator
            label={t('dashboard.lowerLock')}
            isActive={liveData.lock_lower || liveData.clamps?.lower || false}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
